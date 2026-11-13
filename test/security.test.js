'use strict';
// File names from Telegram are untrusted, reports must not run code, and the script must
// not grow new ways to reach the network or the page.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../telegram-batch-downloader.user.js');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'telegram-batch-downloader.user.js'), 'utf8');
const HEADER = SOURCE.slice(0, SOURCE.indexOf('==/UserScript=='));

const docWithName = (fileName) => ({
    id: 1,
    date: 0,
    media: {
        _: 'messageMediaDocument',
        document: {
            _: 'document',
            id: 9,
            size: 1,
            mime_type: 'application/octet-stream',
            attributes: [{ _: 'documentAttributeFilename', file_name: fileName }],
        },
    },
});

test('hostile file names cannot leave the chosen folder or break Windows', () => {
    const hostile = [
        '../../../.bashrc',
        '..\\..\\Windows\\win.ini',
        '/etc/passwd',
        'C:\\boot.ini',
        'a\u0000b.txt',
        'CON.txt',
        'lpt1',
        'name. . .',
        '...',
        '',
        '<img src=x onerror=alert(1)>.mp4',
        'x'.repeat(5000) + '.mp4',
    ];
    for (const raw of hostile) {
        const name = T.buildName({ id: 1, date: 0 }, docWithName(raw).media.document, false);
        assert.doesNotMatch(name, /[\\/:*?"<>|\x00-\x1f]/, `${JSON.stringify(raw)} -> ${name}`);
        assert.notEqual(name, '.');
        assert.notEqual(name, '..');
        assert.doesNotMatch(name, /[. ]$/, `trailing dot or space: ${name}`);
        assert.doesNotMatch(name, /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i, `reserved: ${name}`);
        assert.ok(Buffer.byteLength(name) <= 210, `too long: ${Buffer.byteLength(name)} bytes`);
    }
});

test('generated names for files without a name are plain and predictable', () => {
    const msg = { id: 42, date: 1700000000 };
    assert.equal(T.buildName(msg, { id: 1, mime_type: 'video/mp4' }, false), 'video_20231114_42.mp4');
    assert.equal(T.buildName(msg, { id: 1, mime_type: '../../evil' }, false), 'doc_20231114_42.bin');
    const named = (file_name) => ({ id: 1, attributes: [{ _: 'documentAttributeFilename', file_name }] });
    assert.equal(
        T.buildName(msg, named('document_invoice.pdf'), false),
        'document_invoice.pdf',
        'original names are kept',
    );
    assert.equal(T.buildName(msg, named('photo-2024.png'), false), 'photo-2024.png');
});

test('escapeHtml neutralises every HTML-significant character', () => {
    assert.equal(
        T.escapeHtml(`<a href="x" onclick='y'>&</a>`),
        '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
});

test('the exported HTML report cannot carry script from file names, errors or the chat title', async () => {
    const saved = [];
    const original = T.saveBlob;
    T.saveBlob = (blob, name) => saved.push({ blob, name });
    Object.assign(T.state, {
        title: '<script>alert(1)</script>',
        peerId: 5,
        entries: [
            {
                rawId: 1,
                name: '<img src=x onerror=alert(2)>.jpg',
                kind: 'photo"><svg onload=alert(3)>',
                size: 1,
                onDisk: 0,
                status: 'missing',
                error: '</td><script>alert(4)</script>',
            },
        ],
    });
    try {
        T.exportReport();
    } finally {
        T.saveBlob = original;
    }
    const html = await saved[0].blob.text();
    // Escaped text may still read "onerror=", but no real tag can open.
    assert.doesNotMatch(html, /<(script|img|svg|iframe)\b/i);
    assert.equal(html.match(/<td>/g).length, 7, 'the hostile error text did not close or add a cell');
    assert.match(html, /&lt;script&gt;alert\(1\)/);
});

test('debug info is safe to share: no account, chat, file names or captions', () => {
    Object.assign(T.state, {
        accountId: '424242',
        peerId: -1001234,
        title: 'My Private Chat',
        errors: [{ name: 'secret.mp4', error: 'TIMEOUT: file chunk secret.mp4' }],
        entries: [
            { name: 'diary.pdf', caption: 'private words', status: 'error', error: 'failed diary.pdf', kind: 'doc' },
        ],
    });
    const bundle = T.debugBundle();
    const dump = JSON.stringify(bundle);
    for (const key of ['accountId', 'peerId', 'title', 'folder']) assert.ok(!(key in bundle), key);
    for (const leak of ['424242', 'My Private Chat', 'secret.mp4', 'diary.pdf', 'private words'])
        assert.ok(!dump.includes(leak), leak);
});

test('the userscript header asks for nothing beyond what it needs', () => {
    const grants = [...HEADER.matchAll(/@grant\s+(\S+)/g)].map((m) => m[1]).sort();
    assert.deepEqual(grants, ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'unsafeWindow']);
    const matches = [...HEADER.matchAll(/@match\s+(\S+)/g)].map((m) => m[1]);
    assert.deepEqual(matches, ['https://web.telegram.org/*']);
    assert.match(HEADER, /@noframes/);
    assert.doesNotMatch(HEADER, /@require|@resource|@connect|@include|@exclude-match/);
    for (const url of [...HEADER.matchAll(/@(?:downloadURL|updateURL|homepageURL|supportURL)\s+(\S+)/g)].map(
        (m) => m[1],
    ))
        assert.match(
            url,
            /^https:\/\/(raw\.githubusercontent\.com|github\.com)\/Alfa-Dev404\/telegram-batch-downloader\b/,
        );
});

test('every translated name has a matching translated description', () => {
    const locales = (tag) =>
        [...HEADER.matchAll(new RegExp(`@${tag}:(\\S+)\\s+(.+)`, 'g'))].map((m) => [m[1], m[2].trim()]);
    const names = Object.fromEntries(locales('name'));
    const descriptions = Object.fromEntries(locales('description'));
    assert.deepEqual(Object.keys(names).sort(), Object.keys(descriptions).sort());
    for (const [locale, text] of [...Object.entries(names), ...Object.entries(descriptions)])
        assert.ok(text.length > 3, locale);
});

test('the code has no dynamic code execution or extra network channels', () => {
    const banned = [
        /\beval\s*\(/,
        /\bnew\s+Function\b/,
        /setTimeout\(\s*['"`]/,
        /setInterval\(\s*['"`]/,
        /document\.write/,
        /\bfetch\s*\(/,
        /XMLHttpRequest/,
        /GM_xmlhttpRequest|GM\.xmlHttpRequest/,
        /new\s+WebSocket/,
        /importScripts/,
        /navigator\.sendBeacon/,
        /\.outerHTML\s*=/,
        /insertAdjacentHTML/,
    ];
    for (const pattern of banned) assert.doesNotMatch(SOURCE, pattern, String(pattern));
});

test('innerHTML is only ever set from fixed templates', () => {
    const assignments = [...SOURCE.matchAll(/\.innerHTML\s*=\s*`([\s\S]*?)`;/g)];
    assert.equal(assignments.length, 2, 'panel and popup templates only');
    for (const [, template] of assignments) {
        const interpolated = [...template.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1].trim());
        for (const expr of interpolated) assert.equal(expr, 'VERSION', `unexpected interpolation: ${expr}`);
    }
    assert.equal([...SOURCE.matchAll(/\.innerHTML\s*=/g)].length, 2, 'no other innerHTML writes');
});

test('the API reaches the page only in debug mode, and debug is off', () => {
    assert.equal(T.CFG.debug, false);
    const exposures = [...SOURCE.matchAll(/page\.TGBD\s*=/g)];
    assert.equal(exposures.length, 1);
    assert.match(SOURCE, /if \(CFG\.debug\) page\.TGBD = API;/);
});
