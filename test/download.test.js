'use strict';
// The download engine against a fake Telegram API and an in-memory folder.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../telegram-batch-downloader.user.js');

const CHUNK = 4096;
const SIZE = CHUNK * 5 + 123; // six chunks, the last one short
const PEER = -100;
const RAW_ID = 77;

// File System Access semantics that matter here: writes go to a swap copy, close() commits it,
// abort() discards it, and getFileHandle without { create } fails with NotFoundError.
function fakeFolder(initial = {}) {
    const files = new Map(Object.entries(initial).map(([name, bytes]) => [name, Uint8Array.from(bytes)]));
    const notFound = () => Object.assign(new Error('not found'), { name: 'NotFoundError' });
    const fileHandle = (name) => ({
        async getFile() {
            return { name, size: files.get(name).length };
        },
        async createWritable() {
            let swap = new Uint8Array(0);
            return {
                async write({ position, data }) {
                    const end = position + data.length;
                    if (end > swap.length) {
                        const grown = new Uint8Array(end);
                        grown.set(swap);
                        swap = grown;
                    }
                    swap.set(data, position);
                },
                async close() {
                    files.set(name, swap);
                },
                async abort() {
                    swap = null;
                },
            };
        },
    });
    return {
        files,
        async getFileHandle(name, options = {}) {
            if (!files.has(name)) {
                if (!options.create) throw notFound();
                files.set(name, new Uint8Array(0));
            }
            return fileHandle(name);
        },
        async removeEntry(name) {
            if (!files.delete(name)) throw notFound();
        },
        async *entries() {
            for (const name of files.keys()) yield [name, { kind: 'file', getFile: fileHandle(name).getFile }];
        },
    };
}

// A channel with one document. `faults` lets a test break specific calls.
function fakeTelegram(faults = {}) {
    const content = Uint8Array.from({ length: SIZE }, (_, i) => (i * 31 + 7) % 251);
    const calls = { getMessages: 0, getFile: [] };
    let self = '42';
    const message = (size = SIZE) => ({
        _: 'message',
        id: RAW_ID,
        date: 1700000000,
        message: 'a caption',
        media: {
            _: 'messageMediaDocument',
            document: {
                _: 'document',
                id: '555',
                access_hash: '1',
                file_reference: [calls.getMessages],
                dc_id: 2,
                size,
                mime_type: 'application/pdf',
                attributes: [{ _: 'documentAttributeFilename', file_name: faults.fileName || 'notes.pdf' }],
            },
        },
    });
    const ctx = {
        peerId: PEER,
        accountId: '42',
        inputPeer: { _: 'inputPeerChannel', channel_id: 100, access_hash: '9' },
        managers: {
            appUsersManager: { getSelf: async () => ({ id: self }) },
            apiManager: {
                async invokeApi(method, params) {
                    if (method === 'channels.getMessages' || method === 'messages.getMessages') {
                        calls.getMessages++;
                        if (faults.deletedAfterFirstLookup && calls.getMessages > 1) return { messages: [] };
                        return { messages: [message(faults.serverSize)] };
                    }
                    if (method !== 'upload.getFile') throw new Error(`unexpected ${method}`);
                    const { offset, limit } = params;
                    calls.getFile.push(offset);
                    calls.inFlight = (calls.inFlight || 0) + 1;
                    calls.maxInFlight = Math.max(calls.maxInFlight || 0, calls.inFlight);
                    const fault = faults.onChunk?.(offset, calls.getFile.filter((o) => o === offset).length);
                    if (fault === 'switch-account') self = '99';
                    else if (fault) {
                        calls.inFlight = (calls.inFlight || 1) - 1;
                        throw fault;
                    }
                    // Later chunks answer sooner, so parts land out of order.
                    await new Promise((r) => {
                        setTimeout(r, (SIZE - offset) / CHUNK);
                    });
                    calls.inFlight--;
                    let bytes = content.slice(offset, offset + limit);
                    if (faults.shortChunkAt === offset) bytes = bytes.slice(0, 10);
                    return { _: 'upload.file', bytes };
                },
            },
        },
    };
    const entry = T.manifestEntries(message(), PEER)[0];
    return { ctx, entry, content, calls };
}

beforeEach(() => {
    Object.assign(T.CFG, { chunkBytes: CHUNK, retries: 3, retryBaseMs: 0, gapMs: 0, partsInFlight: 4, concurrency: 3 });
    Object.assign(T.state, { cancel: false, controller: null, total: 1, accountId: null, peerId: null });
});

test('downloads every chunk in parallel and writes a byte-exact file', async () => {
    const { ctx, entry, content, calls } = fakeTelegram();
    const folder = fakeFolder();
    await T.downloadEntry(entry, ctx, folder, new Set());
    assert.equal(entry.status, 'ok');
    assert.deepEqual(folder.files.get('notes.pdf'), content);
    assert.equal(calls.getFile.length, 6);
    assert.notDeepEqual(calls.getFile, [...calls.getFile].sort((a, b) => a - b).reverse(), 'requests should overlap');
});

test('an expired file reference is refreshed once and the download continues', async () => {
    const { ctx, entry, content, calls } = fakeTelegram({
        onChunk: (offset, attempt) => (offset === 0 && attempt === 1 ? { type: 'FILE_REFERENCE_EXPIRED' } : null),
    });
    const folder = fakeFolder();
    await T.downloadEntry(entry, ctx, folder, new Set());
    assert.deepEqual(folder.files.get('notes.pdf'), content);
    assert.equal(calls.getMessages, 2, 'initial lookup plus one refresh');
});

test('a FLOOD_WAIT pauses and then completes', async () => {
    const { ctx, entry, content } = fakeTelegram({
        onChunk: (offset, attempt) => (offset === CHUNK && attempt === 1 ? { type: 'FLOOD_WAIT_0' } : null),
    });
    T.CFG.retries = 1;
    const folder = fakeFolder();
    await T.downloadEntry(entry, ctx, folder, new Set());
    assert.deepEqual(folder.files.get('notes.pdf'), content);
});

test('a short chunk fails the file and leaves nothing on disk', async () => {
    const { ctx, entry } = fakeTelegram({ shortChunkAt: CHUNK * 2 });
    const folder = fakeFolder();
    await assert.rejects(T.downloadEntry(entry, ctx, folder, new Set()), /Short or oversized chunk/);
    assert.equal(folder.files.size, 0);
});

test('cancelling mid-file leaves nothing on disk', async () => {
    const { ctx, entry } = fakeTelegram({
        onChunk: (offset) => {
            if (offset === CHUNK * 3) T.state.cancel = true;
            return null;
        },
    });
    const folder = fakeFolder();
    await assert.rejects(T.downloadEntry(entry, ctx, folder, new Set()), /cancelled/);
    assert.equal(folder.files.size, 0);
});

test('switching Telegram accounts mid-file stops the download', async () => {
    const { ctx, entry } = fakeTelegram({ onChunk: (offset) => (offset === CHUNK ? 'switch-account' : null) });
    const folder = fakeFolder();
    await assert.rejects(T.downloadEntry(entry, ctx, folder, new Set()), /ACCOUNT_CHANGED/);
    assert.equal(folder.files.size, 0);
});

test('an attachment whose size changed on Telegram is refused before anything is written', async () => {
    const { ctx, entry, calls } = fakeTelegram({ serverSize: SIZE + 1 });
    const folder = fakeFolder();
    await assert.rejects(T.downloadEntry(entry, ctx, folder, new Set()), /MEDIA_CHANGED/);
    assert.equal(folder.files.size, 0);
    assert.equal(calls.getFile.length, 0);
});

test('a complete file already on disk is skipped without downloading', async () => {
    const { ctx, entry, content, calls } = fakeTelegram();
    const folder = fakeFolder({ 'notes.pdf': content });
    await T.downloadEntry(entry, ctx, folder, new Set());
    assert.equal(entry.status, 'ok');
    assert.equal(calls.getFile.length, 0);
});

test("someone else's file with the same name is preserved; ours gets a new name", async () => {
    const { ctx, entry, content } = fakeTelegram();
    const theirs = [1, 2, 3, 4, 5, 6, 7];
    const folder = fakeFolder({ 'notes.pdf': theirs });
    await T.downloadEntry(entry, ctx, folder, new Set(['notes.pdf']));
    assert.deepEqual([...folder.files.get('notes.pdf')], theirs);
    assert.equal(entry.name, `notes_${RAW_ID}_retry1.pdf`);
    assert.deepEqual(folder.files.get(entry.name), content);
});

test('an empty leftover from an interrupted run is reused, not renamed', async () => {
    const { ctx, entry, content } = fakeTelegram();
    const folder = fakeFolder({ 'notes.pdf': [] });
    await T.downloadEntry(entry, ctx, folder, new Set(['notes.pdf']));
    assert.equal(entry.name, 'notes.pdf');
    assert.deepEqual(folder.files.get('notes.pdf'), content);
    assert.equal(folder.files.size, 1);
});

test('without a folder the file is assembled in memory and handed to the browser once', async () => {
    const { ctx, entry, content } = fakeTelegram();
    const saved = [];
    const original = T.saveBlob;
    T.saveBlob = (blob, name) => saved.push({ blob, name });
    try {
        await T.downloadEntry(entry, ctx, null, new Set());
    } finally {
        T.saveBlob = original;
    }
    assert.equal(saved.length, 1);
    assert.equal(saved[0].name, 'notes.pdf');
    assert.deepEqual(new Uint8Array(await saved[0].blob.arrayBuffer()), content);
});

test('without a folder, files over the memory limit are refused up front', async () => {
    const { ctx, entry, calls } = fakeTelegram();
    T.CFG.blobLimitBytes = SIZE - 1;
    try {
        await assert.rejects(T.downloadEntry(entry, ctx, null, new Set()), /need a folder/);
    } finally {
        T.CFG.blobLimitBytes = 512 * 1024 * 1024;
    }
    assert.equal(calls.getFile.length, 0);
});

test('Parallel requests is a ceiling for the whole job, not per file', async () => {
    const { ctx, entry, content, calls } = fakeTelegram();
    T.CFG.partsInFlight = 2;
    const folders = [fakeFolder(), fakeFolder(), fakeFolder()];
    await Promise.all(folders.map((folder) => T.downloadEntry({ ...entry }, ctx, folder, new Set())));
    assert.ok(calls.maxInFlight <= 2, `max in flight ${calls.maxInFlight}`);
    assert.equal(calls.maxInFlight, 2, 'should still use the parallelism it is given');
    for (const folder of folders) assert.deepEqual(folder.files.get('notes.pdf'), content);
});

test('if refreshing an expired reference fails, that real error is reported without retrying', async () => {
    const { ctx, entry, calls } = fakeTelegram({
        deletedAfterFirstLookup: true,
        onChunk: () => ({ type: 'FILE_REFERENCE_EXPIRED' }),
    });
    const folder = fakeFolder();
    await assert.rejects(T.downloadEntry(entry, ctx, folder, new Set()), /UNAVAILABLE/);
    assert.equal(folder.files.size, 0);
    assert.ok(calls.getFile.length <= T.CFG.partsInFlight, `stale reference retried ${calls.getFile.length} times`);
});
