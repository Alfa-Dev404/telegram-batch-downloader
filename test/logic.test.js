'use strict';
// Retries, scanning, captions and settings. Run all tests with: node --test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../telegram-batch-downloader.user.js');

const doc = (id) => ({
    id,
    date: 1700000000,
    message: `caption ${id}`,
    media: {
        _: 'messageMediaDocument',
        document: { _: 'document', id: 1000 + id, size: 10, mime_type: 'video/mp4', attributes: [] },
    },
});
// 250 messages, served newest first in pages of 100, like messages.getHistory.
const history = (offset) => {
    const top = offset || 251;
    const messages = [];
    for (let id = top - 1; id >= Math.max(1, top - 100); id--) messages.push(doc(id));
    return { messages };
};

T.CFG.gapMs = 0;

test('built-in self test passes', () => {
    assert.ok(T.selfTest());
});

test('FLOOD_WAIT does not use up retries, but the total wait is capped', async () => {
    T.CFG.retries = 1;
    let calls = 0;
    const result = await T.withRetry(async () => {
        if (++calls < 3) throw { type: 'FLOOD_WAIT_0' };
        return 'ok';
    }, 't');
    assert.equal(result, 'ok');
    assert.equal(calls, 3);

    await assert.rejects(
        T.withRetry(async () => {
            throw new Error('boom');
        }, 't'),
        /boom/,
    );

    T.CFG.floodMaxWaitMs = 1500;
    await assert.rejects(
        T.withRetry(async () => {
            throw { type: 'FLOOD_WAIT_0' };
        }, 't'),
    );
});

test('an interrupted scan resumes from its checkpoint', async () => {
    T.CFG.scanCheckpointMs = 0;
    let checkpoint = null;
    await assert.rejects(
        T.scanChannel(
            { peerId: 5 },
            null,
            async (offset) => {
                if (offset === 51) throw new Error('network down');
                return history(offset);
            },
            null,
            async (cp) => {
                checkpoint = structuredClone(cp);
            },
        ),
        /network down/,
    );
    assert.equal(checkpoint.offset, 51);
    assert.equal(checkpoint.scanned, 200);

    const offsets = [];
    const scan = await T.scanChannel(
        { peerId: 5 },
        null,
        async (offset) => {
            offsets.push(offset);
            return history(offset);
        },
        checkpoint,
    );
    assert.equal(offsets[0], 51);
    assert.equal(scan.entries.length, 250);
    assert.equal(scan.scanned, 250);
    assert.ok(scan.scanComplete);
});

test('captions for one file keep the whole chat in _captions.json', async () => {
    const scan = await T.scanChannel({ peerId: 5 }, null, async (offset) => history(offset));
    const files = new Map();
    const dir = {
        name: 'out',
        async queryPermission() {
            return 'granted';
        },
        async getDirectoryHandle() {
            return dir;
        },
        async getFileHandle(name) {
            return {
                async createWritable() {
                    let text = '';
                    return {
                        async write(t) {
                            text += t;
                        },
                        async close() {
                            files.set(name, text);
                        },
                        async abort() {},
                    };
                },
            };
        },
    };
    T.disk.handle = dir;
    Object.assign(T.state, { accountId: '42', peerId: 5, entries: scan.entries.slice(0, 3) });
    await T.writeSidecarFiles([T.state.entries[0]]);
    assert.equal(JSON.parse(files.get('_captions.json')).length, 3);
    assert.equal(files.size, 2);
});

test('settings: a bad value changes nothing, saved junk is ignored, hidden keys never load', () => {
    let stored = null;
    globalThis.GM_setValue = (key, value) => {
        stored = structuredClone(value);
    };
    globalThis.GM_getValue = () => stored;

    const before = { ...T.CFG };
    assert.throws(() => T.applySettings({ concurrency: 99, gapMs: 5 }));
    assert.deepEqual({ ...T.CFG }, before);
    assert.equal(stored, null);

    T.applySettings({ concurrency: 1 });
    assert.equal(stored.concurrency, 1);

    stored = { concurrency: 'fast', gapMs: 5 };
    assert.match(T.loadSettings(), /ignored/);
    assert.equal(T.CFG.concurrency, 1);
    assert.equal(T.CFG.gapMs, 0);

    stored = { concurrency: 2, debug: true, evil: 1 };
    assert.equal(T.loadSettings(), '');
    assert.equal(T.CFG.concurrency, 2);
    assert.equal(T.CFG.debug, false);
    assert.ok(!('evil' in T.CFG));
});
