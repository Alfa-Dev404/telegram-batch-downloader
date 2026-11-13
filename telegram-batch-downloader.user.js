// ==UserScript==
// @name              Telegram Media Batch Downloader
// @name:ar           أداة تنزيل وسائط تيليجرام دفعة واحدة
// @name:de           Telegram Medien-Massendownloader
// @name:es           Descargador masivo de medios de Telegram
// @name:fa           دانلودر گروهی رسانه‌های تلگرام
// @name:fr           Téléchargeur de médias Telegram par lots
// @name:hi           टेलीग्राम मीडिया बैच डाउनलोडर
// @name:id           Pengunduh Massal Media Telegram
// @name:it           Downloader multiplo di media Telegram
// @name:ja           Telegram メディア一括ダウンローダー
// @name:ko           텔레그램 미디어 일괄 다운로더
// @name:pt-BR        Baixador em massa de mídia do Telegram
// @name:ru           Пакетный загрузчик медиа из Telegram
// @name:tr           Telegram Toplu Medya İndirici
// @name:uk           Пакетний завантажувач медіа з Telegram
// @name:vi           Trình tải hàng loạt phương tiện Telegram
// @name:zh-CN        Telegram 媒体批量下载器
// @name:zh-TW        Telegram 媒體批次下載器
// @namespace         https://github.com/Alfa-Dev404
// @license           MIT
// @version           1.0.1
// @description       Download all accessible Telegram attachments into a chosen folder, with exact size checks, captions and resumable jobs.
// @description:ar    نزّل جميع مرفقات تيليجرام المتاحة إلى مجلد تختاره، مع تحقق دقيق من الحجم وحفظ التعليقات واستئناف التنزيلات.
// @description:de    Lädt alle zugänglichen Telegram-Anhänge in einen gewählten Ordner, mit exakter Größenprüfung, Bildunterschriften und fortsetzbaren Downloads.
// @description:es    Descarga todos los archivos adjuntos accesibles de Telegram en una carpeta, con verificación exacta del tamaño, pies de foto y descargas reanudables.
// @description:fa    همه پیوست‌های در دسترس تلگرام را در پوشه دلخواه دانلود کنید؛ با بررسی دقیق حجم، ذخیره کپشن‌ها و ادامه دانلود.
// @description:fr    Téléchargez toutes les pièces jointes Telegram accessibles dans un dossier de votre choix, avec vérification exacte de la taille, légendes et reprise des téléchargements.
// @description:hi    टेलीग्राम की सभी उपलब्ध फ़ाइलें अपने चुने हुए फ़ोल्डर में डाउनलोड करें, सटीक साइज़ जाँच, कैप्शन और फिर से शुरू होने वाले डाउनलोड के साथ।
// @description:id    Unduh semua lampiran Telegram yang dapat diakses ke folder pilihan, dengan pemeriksaan ukuran yang akurat, keterangan, dan unduhan yang bisa dilanjutkan.
// @description:it    Scarica tutti gli allegati di Telegram accessibili in una cartella a scelta, con controllo esatto delle dimensioni, didascalie e download ripristinabili.
// @description:ja    アクセスできる Telegram の添付ファイルをすべて指定フォルダーに保存。サイズの厳密な確認、キャプション保存、再開可能なダウンロードに対応。
// @description:ko    접근 가능한 텔레그램 첨부 파일을 선택한 폴더에 모두 저장합니다. 정확한 크기 확인, 캡션 저장, 이어받기를 지원합니다.
// @description:pt-BR Baixe todos os anexos acessíveis do Telegram para uma pasta escolhida, com verificação exata de tamanho, legendas e downloads retomáveis.
// @description:ru    Скачивайте все доступные вложения Telegram в выбранную папку: точная проверка размера, подписи и возобновляемые загрузки.
// @description:tr    Erişilebilen tüm Telegram eklerini seçtiğiniz klasöre indirin; birebir boyut kontrolü, açıklamalar ve kaldığı yerden devam eden indirmeler.
// @description:uk    Завантажуйте всі доступні вкладення Telegram у вибрану папку: точна перевірка розміру, підписи та відновлювані завантаження.
// @description:vi    Tải tất cả tệp đính kèm Telegram có thể truy cập vào thư mục bạn chọn, kiểm tra chính xác dung lượng, lưu chú thích và tải tiếp khi bị gián đoạn.
// @description:zh-CN 将 Telegram 中所有可访问的附件下载到所选文件夹，支持精确大小校验、保存说明文字和断点续传。
// @description:zh-TW 將 Telegram 中所有可存取的附件下載到所選資料夾，支援精確大小檢查、儲存說明文字與斷點續傳。
// @author            Alfa-Dev404 (based on the original by OsoCosmico)
// @homepageURL       https://github.com/Alfa-Dev404/telegram-batch-downloader
// @supportURL        https://github.com/Alfa-Dev404/telegram-batch-downloader/issues
// @downloadURL       https://raw.githubusercontent.com/Alfa-Dev404/telegram-batch-downloader/main/telegram-batch-downloader.user.js
// @updateURL         https://raw.githubusercontent.com/Alfa-Dev404/telegram-batch-downloader/main/telegram-batch-downloader.user.js
// @match             https://web.telegram.org/*
// @grant             unsafeWindow
// @grant             GM_addStyle
// @grant             GM_getValue
// @grant             GM_setValue
// @run-at            document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';
    /* global cloneInto -- Firefox only; see toPage */

    const page = typeof unsafeWindow === 'undefined' ? globalThis : unsafeWindow;
    const VERSION = '1.0.1';
    const JOB_VERSION = 10;
    const CFG = {
        concurrency: 3,
        gapMs: 200,
        retries: 3,
        retryBaseMs: 1200,
        floodMaxWaitMs: 30 * 60 * 1000, // Total FLOOD_WAIT one request may sit out before it fails.
        internalsTimeoutMs: 30000,
        requestTimeoutMs: 120000,
        scanPageSize: 100,
        scanMaxMessages: 0, // 0 = full history; a positive limit is reported as an incomplete scan.
        scanCheckpointMs: 15000, // Save scan progress at most this often, so an interrupted scan resumes without slowing a long one.
        chunkBytes: 1024 * 1024, // Telegram's maximum for one upload.getFile request.
        partsInFlight: 4, // Parallel chunk requests for one file, shared out when several download at once.
        captionSidecars: true,
        filter: 'all', // all | video | audio | voice | round | photo | gif | sticker | doc
        inlineButtons: true, // A download button on every attachment the script can resolve.
        blobLimitBytes: 512 * 1024 * 1024, // Memory ceiling for downloads without a folder.
        debug: false, // Also exposes window.TGBD to the page; leave off for normal use.
    };
    const state = {
        running: false,
        cancel: false,
        controller: null,
        phase: 'idle',
        context: null,
        peerId: null,
        accountId: null,
        title: '',
        entries: [],
        scanComplete: false,
        scanCheckpoint: null,
        scanned: 0,
        unavailable: 0,
        errors: [],
        total: 0,
        done: 0,
        ok: 0,
        fail: 0,
        bytes: 0,
        unfinished: false,
    };
    const disk = { handle: null };
    const $ = (s) => (typeof document === 'undefined' ? null : document.querySelector(s));
    const errorText = (e) =>
        String(e?.type || (e?.name && e.name !== 'Error' ? `${e.name}: ${e.message || ''}` : e?.message) || e);
    const warn = (...a) => console.warn('[TGBD]', ...a);
    const escapeHtml = (s) =>
        String(s).replace(
            /[&<>"']/g,
            (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
        );
    const fmtBytes = (n) => {
        if (!(n > 0)) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(4, Math.floor(Math.log(n) / Math.log(1024)));
        return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
    };
    const fmtEta = (s) => {
        if (!Number.isFinite(s) || s < 0) return '—';
        s = Math.ceil(s);
        if (s < 60) return `${s}s`;
        if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
        return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
    };
    const fmtSpeed = (n) => (n > 0 ? `${fmtBytes(n)}/s` : '—');
    function checkStopped(signal = state.controller && state.controller.signal) {
        if (state.cancel || signal?.aborted) throw new Error('cancelled');
    }
    function sleep(ms, signal = state.controller && state.controller.signal) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                reject(new Error('cancelled'));
                return;
            }
            const onAbort = () => {
                clearTimeout(timer);
                reject(new Error('cancelled'));
            };
            const timer = setTimeout(() => {
                signal?.removeEventListener('abort', onAbort);
                resolve();
            }, ms);
            signal?.addEventListener('abort', onAbort, { once: true });
        });
    }
    function cancel() {
        if (!state.running) return;
        state.cancel = true;
        state.controller?.abort();
        ui.status('Cancelling…');
    }

    // A timeout stops the job: retrying a still-pending RPC can accumulate requests.
    async function bounded(promise, label, signal = state.controller && state.controller.signal) {
        let timer, onAbort;
        const stop = new Promise((resolve, reject) => {
            onAbort = () => reject(new Error('cancelled'));
            if (signal?.aborted) {
                onAbort();
                return;
            }
            signal?.addEventListener('abort', onAbort, { once: true });
            timer = setTimeout(
                () => reject(new Error(`TIMEOUT: ${label}; retry the job when Telegram responds.`)),
                CFG.requestTimeoutMs,
            );
        });
        try {
            return await Promise.race([promise, stop]);
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        }
    }
    let floodUntil = 0,
        floodAnnounced = 0;
    const PERMANENT_RE =
        /cancelled|TIMEOUT|ACCOUNT_CHANGED|MEDIA_CHANGED|UNAVAILABLE|CHANNEL_(INVALID|PRIVATE)|CHAT_FORBIDDEN|MSG_ID_INVALID|PEER_ID_INVALID|AUTH_KEY|SESSION_REVOKED|NotAllowedError|SecurityError|QuotaExceededError|InvalidStateError/i;
    // Every request waits out the shared rate limit, and the user sees why nothing moves.
    async function waitFlood() {
        while (floodUntil > Date.now()) {
            const left = (floodUntil - Date.now()) / 1000;
            if (floodAnnounced !== floodUntil) {
                floodAnnounced = floodUntil;
                ui.log(`Telegram rate limit: pausing ${fmtEta(left)}.`);
            }
            ui.status(`Rate limited by Telegram · resuming in ${fmtEta(left)}`);
            await sleep(Math.min(1000, floodUntil - Date.now()));
        }
    }
    // FLOOD_WAIT is Telegram asking for a pause, not a failure, so it does not use up a retry.
    // CFG.floodMaxWaitMs caps how long one request may keep being told to wait.
    async function withRetry(fn, label) {
        let floodWaited = 0;
        for (let attempt = 1; ; ) {
            checkStopped();
            await waitFlood();
            try {
                return await fn();
            } catch (err) {
                const message = errorText(err);
                const flood = /FLOOD_(?:PREMIUM_)?WAIT_(\d+)/i.exec(message);
                if (flood) {
                    const ms = (Number(flood[1]) + 1) * 1000;
                    floodWaited += ms;
                    if (floodWaited > CFG.floodMaxWaitMs) throw err;
                    floodUntil = Math.max(floodUntil, Date.now() + ms);
                    continue;
                }
                if (PERMANENT_RE.test(message) || attempt >= CFG.retries) throw err;
                ui.log(`${label}: retry ${attempt}/${CFG.retries - 1} (${message})`);
                await sleep(CFG.retryBaseMs * 2 ** (attempt - 1));
                attempt++;
            }
        }
    }
    async function waitFor(path) {
        const end = Date.now() + CFG.internalsTimeoutMs;
        while (Date.now() < end) {
            checkStopped();
            const value = path.split('.').reduce((o, k) => o?.[k], page);
            if (value) return value;
            await sleep(200);
        }
        throw new Error(`Telegram internal ${path} is unavailable. Reload Telegram Web K.`);
    }
    async function currentPeerId() {
        const im = await waitFor('appImManager');
        const id = Number(im.chat?.peerId ?? im.chat?.peerID);
        if (!Number.isSafeInteger(id) || !id) throw new Error('Open a chat first.');
        return id;
    }
    async function getContext(peerId) {
        const managers = await waitFor('appImManager.managers');
        peerId = peerId ?? (await currentPeerId());
        const self = await bounded(managers.appUsersManager.getSelf(), 'account lookup');
        const inputPeer = await bounded(managers.appPeersManager.getInputPeerById(peerId), 'chat lookup');
        if (!self?.id || !inputPeer || inputPeer._ === 'inputPeerEmpty')
            throw new Error('Chat or account is unavailable.');
        return { managers, peerId: Number(peerId), accountId: String(self.id), inputPeer };
    }
    async function assertAccount(ctx) {
        checkStopped();
        const self = await bounded(ctx.managers.appUsersManager.getSelf(), 'account lookup');
        if (String(self?.id) !== ctx.accountId)
            throw new Error('ACCOUNT_CHANGED: switch back to the original account and resume.');
        checkStopped();
    }
    // Firefox runs userscripts behind Xray wrappers, so objects built here must be cloned into the page
    // before Telegram's code can read them. Chrome has no cloneInto and needs nothing.
    const toPage = (value) => (typeof cloneInto === 'function' ? cloneInto(value, page) : value);
    async function invoke(ctx, method, params, options = {}) {
        return withRetry(async () => {
            await assertAccount(ctx);
            return bounded(
                ctx.managers.apiManager.invokeApi(method, toPage(params), toPage({ ...options, floodMaxTimeout: 0 })),
                method,
            );
        }, method);
    }

    // One pool of chunk requests for the whole job: CFG.partsInFlight is a true ceiling across every
    // file downloading at once, because Telegram rate-limits the account, not the file.
    const requestSlots = { used: 0, waiting: [] };
    async function acquireSlot() {
        if (requestSlots.used < CFG.partsInFlight) {
            requestSlots.used++;
            return;
        }
        await new Promise((resolve) => {
            requestSlots.waiting.push(resolve);
        });
    }
    function releaseSlot() {
        const next = requestSlots.waiting.shift();
        if (next) next();
        else requestSlots.used--;
    }

    const MIME_EXT = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/heif': 'heif',
        'image/avif': 'avif',
        'image/svg+xml': 'svg',
        'image/tiff': 'tiff',
        'image/bmp': 'bmp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'video/x-matroska': 'mkv',
        'video/x-msvideo': 'avi',
        'video/mpeg': 'mpeg',
        'video/mp2t': 'ts',
        'video/3gpp': '3gp',
        'video/x-flv': 'flv',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/flac': 'flac',
        'audio/x-flac': 'flac',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
        'audio/aac': 'aac',
        'audio/webm': 'webm',
        'application/ogg': 'ogg',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
        'application/x-7z-compressed': '7z',
        'application/vnd.rar': 'rar',
        'application/x-rar-compressed': 'rar',
        'application/gzip': 'gz',
        'application/x-tgsticker': 'tgs',
        'application/json': 'json',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'text/html': 'html',
        'application/octet-stream': 'bin',
    };
    function sanitize(value, maxBytes = 180) {
        let s = String(value)
            .normalize('NFC')
            .replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '_')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[. ]+$/, '');
        if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s)) s = '_' + s;
        let result = '',
            bytes = 0;
        const encoder = new TextEncoder();
        for (const char of s) {
            bytes += encoder.encode(char).length;
            if (bytes > maxBytes) break;
            result += char;
        }
        return result.replace(/[. ]+$/, '') || 'file';
    }
    // Only for allocating collision-free names; disk verification uses exact names.
    const baseKey = (name) => String(name).normalize('NFC').toLowerCase();
    function docFileName(media) {
        const attribute = (media.attributes || []).find((a) => a._ === 'documentAttributeFilename');
        return attribute?.file_name || media.file_name || media.fileName || '';
    }
    function guessExt(media, isPhoto) {
        if (isPhoto) return 'jpg';
        return (
            MIME_EXT[
                String(media.mime_type || media.mimeType || '')
                    .toLowerCase()
                    .split(';')[0]
            ] || 'bin'
        );
    }
    function mediaKind(media, isPhoto) {
        if (isPhoto) return 'photo';
        const attrs = media.attributes || [];
        const has = (type) => attrs.find((a) => a._ === type);
        if (has('documentAttributeSticker') || has('documentAttributeCustomEmoji') || media.sticker) return 'sticker';
        if (
            has('documentAttributeAudio')?.pFlags?.voice ||
            has('documentAttributeAudio')?.voice ||
            media.type === 'voice'
        )
            return 'voice';
        if (
            has('documentAttributeVideo')?.pFlags?.round_message ||
            has('documentAttributeVideo')?.round_message ||
            media.type === 'round'
        )
            return 'round';
        const mime = String(media.mime_type || media.mimeType || '').toLowerCase();
        const name = docFileName(media);
        if (has('documentAttributeAnimated') || mime === 'image/gif' || /\.gif$/i.test(name)) return 'gif';
        if (
            has('documentAttributeAudio') ||
            /^audio\//.test(mime) ||
            /\.(mp3|m4a|aac|flac|wav|ogg|opus|wma|aiff|alac)$/i.test(name)
        )
            return 'audio';
        if (
            has('documentAttributeVideo') ||
            /^video\//.test(mime) ||
            /\.(mp4|mkv|mov|webm|avi|m4v|ts|mpeg|mpg|3gp|wmv|flv)$/i.test(name)
        )
            return 'video';
        if (/^image\//.test(mime) || /\.(jpg|jpeg|png|webp|heic|heif|avif|bmp|tiff|svg)$/i.test(name)) return 'photo';
        return 'doc';
    }
    function buildName(msg, media, isPhoto) {
        const original = String(docFileName(media));
        if (original) {
            const dot = original.lastIndexOf('.');
            const stem = dot > 0 ? original.slice(0, dot) : original;
            const ext = dot > 0 && dot < original.length - 1 ? original.slice(dot + 1) : guessExt(media, isPhoto);
            return `${sanitize(stem)}.${sanitize(ext, 24)}`;
        }
        const date = msg.date ? new Date(msg.date * 1000).toISOString().slice(0, 10).replace(/-/g, '') + '_' : '';
        return `${isPhoto ? 'img' : mediaKind(media, false)}_${date}${msg.id}.${guessExt(media, isPhoto)}`;
    }
    function photoVariant(media) {
        return (
            (media.sizes || [])
                .filter((s) => ['photoSize', 'photoSizeProgressive', 'photoCachedSize'].includes(s?._))
                .map((s) => ({
                    ...s,
                    size:
                        s._ === 'photoSizeProgressive'
                            ? Math.max(0, ...s.sizes)
                            : s._ === 'photoCachedSize'
                              ? s.bytes.length
                              : Number(s.size),
                }))
                .filter((s) => Number.isSafeInteger(s.size) && s.size > 0)
                .sort((a, b) => b.size - a.size)[0] || null
        );
    }
    function mediaSize(media, isPhoto = media._ === 'photo') {
        const n = isPhoto ? photoVariant(media)?.size : media.size == null ? NaN : Number(media.size);
        return Number.isSafeInteger(n) && n >= 0 ? n : null;
    }
    function mediaItems(msg) {
        const result = [];
        const visit = (m) => {
            if (!m) return;
            for (const type of ['document', 'photo']) {
                const media = m[type];
                if (media?.id != null && media._ !== `${type}Empty`) result.push({ media, isPhoto: type === 'photo' });
            }
            // Web previews and games can contain Telegram-hosted attachments too.
            for (const nested of [m.webpage, m.game]) {
                if (nested)
                    for (const type of ['document', 'photo']) {
                        const media = nested[type];
                        if (media?.id != null && media._ !== `${type}Empty`)
                            result.push({ media, isPhoto: type === 'photo' });
                    }
            }
            for (const extended of m.extended_media || []) if (extended.media) visit(extended.media);
        };
        visit(msg?.media);
        const seen = new Set();
        return result.filter(({ media, isPhoto }) => {
            const key = `${isPhoto}:${media.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    function matchesFilter(entry, filter = CFG.filter) {
        return (
            filter === 'all' ||
            entry.kind === filter ||
            (filter === 'video' && entry.kind === 'round') ||
            (filter === 'audio' && entry.kind === 'voice')
        );
    }
    function captionParts(msg) {
        return {
            text: String(msg?.message ?? msg?.caption ?? ''),
            entities: msg?.totalEntities || msg?.entities || [],
        };
    }
    function entityUrls(text, entities) {
        return [
            ...new Set(
                (entities || []).flatMap((e) => {
                    if (e?.url) return [String(e.url)];
                    const raw = e?._ === 'messageEntityUrl' ? text.slice(e.offset, e.offset + e.length) : '';
                    return /^(https?:\/\/|www\.)/i.test(raw) || raw.includes('/') ? [raw] : [];
                }),
            ),
        ];
    }
    function msgLink(msg) {
        // Web K uses bare negative IDs, not the Bot API's -100 prefix convention.
        const id = msg.peer_id?.channel_id;
        return id ? `https://t.me/c/${id}/${msg.id}` : '';
    }
    function manifestEntries(msg, peerId) {
        const cap = captionParts(msg);
        return mediaItems(msg).map(({ media, isPhoto }) => ({
            key: `${peerId}:${msg.id}:${isPhoto ? 'photo' : 'document'}:${media.id}`,
            peerId,
            rawId: msg.id,
            mid: msg.mid ?? msg.id,
            mediaId: String(media.id),
            name: buildName(msg, media, isPhoto),
            originalName: docFileName(media),
            isPhoto,
            kind: mediaKind(media, isPhoto),
            size: mediaSize(media, isPhoto),
            thumbType: isPhoto ? photoVariant(media)?.type : '',
            mime: String(media.mime_type || media.mimeType || (isPhoto ? 'image/jpeg' : 'application/octet-stream')),
            date: msg.date || 0,
            groupedId: String(msg.grouped_id || msg.groupedId || ''),
            caption: cap.text,
            captionUrls: entityUrls(cap.text, cap.entities),
            sender: String(msg.post_author || msg.from_id?.user_id || msg.from_id?.channel_id || msg.fromId || ''),
            link: msgLink(msg),
            status: 'pending',
            onDisk: 0,
            error: '',
        }));
    }
    function backfillCaptions(entries, groups) {
        for (const e of entries) {
            const cap = !e.caption && groups.get(e.groupedId);
            if (cap)
                Object.assign(e, {
                    caption: cap.text,
                    captionUrls: entityUrls(cap.text, cap.entities),
                    captionFrom: 'album',
                });
        }
    }
    function suffixedName(name, suffix) {
        const dot = name.lastIndexOf('.');
        return `${sanitize(dot > 0 ? name.slice(0, dot) : name, 150)}_${suffix}${dot > 0 ? name.slice(dot) : ''}`;
    }
    function dedupeNames(entries) {
        const reserved = new Set(entries.map((e) => baseKey(e.name)));
        const used = new Set();
        for (const e of entries) {
            const original = e.name;
            let n = 0;
            while (used.has(baseKey(e.name))) {
                e.name = suffixedName(original, `${e.rawId ?? e.mid}${n++ ? '_' + n : ''}`);
                while (reserved.has(baseKey(e.name)) || used.has(baseKey(e.name)))
                    e.name = suffixedName(original, `${e.rawId ?? e.mid}_${++n}`);
            }
            used.add(baseKey(e.name));
        }
        return entries;
    }

    // Full raw history covers documents of ANY extension, audio, voice, rounds,
    // GIFs and stickers. No search filter can silently exclude a media category.
    // History is read newest to oldest, so a checkpoint is just the lowest ID read plus what was found;
    // `resume` continues from one, and `onCheckpoint` receives one at most every CFG.scanCheckpointMs.
    async function scanChannel(
        ctx,
        onProgress,
        fetchPage = (offset) =>
            invoke(ctx, 'messages.getHistory', {
                peer: ctx.inputPeer,
                offset_id: offset,
                offset_date: 0,
                add_offset: 0,
                limit: CFG.scanPageSize,
                max_id: 0,
                min_id: 0,
                hash: 0,
            }),
        resume = null,
        onCheckpoint = null,
    ) {
        const byKey = new Map((resume?.entries || []).map((e) => [e.key, e]));
        const groups = new Map(resume?.groups || []),
            seen = new Set();
        let offset = resume?.offset || 0,
            scanned = resume?.scanned || 0,
            unavailable = resume?.unavailable || 0;
        let complete = false,
            lastCheckpoint = Date.now();
        for (;;) {
            checkStopped();
            const res = await fetchPage(offset);
            if (!Array.isArray(res?.messages)) throw new Error('Unexpected history response; scan stopped.');
            if (!res.messages.length) {
                complete = true;
                break;
            }
            const ids = res.messages.map((m) => m.id).filter((id) => Number.isSafeInteger(id) && id > 0);
            const next = Math.min(...ids);
            if (!ids.length || (offset && next >= offset))
                throw new Error('History pagination stopped advancing; scan stopped.');
            for (const msg of res.messages) {
                if (!Number.isSafeInteger(msg.id) || msg.id <= 0 || seen.has(msg.id)) continue;
                if (CFG.scanMaxMessages && scanned >= CFG.scanMaxMessages) break;
                seen.add(msg.id);
                scanned++;
                const cap = captionParts(msg),
                    gid = String(msg.grouped_id || msg.groupedId || '');
                if (gid && cap.text && !groups.has(gid)) groups.set(gid, cap);
                for (const e of manifestEntries(msg, ctx.peerId)) byKey.set(e.key, e);
                if (
                    msg.media?._ === 'messageMediaUnsupported' ||
                    (msg.media?.extended_media || []).some((e) => e._ === 'messageExtendedMediaPreview')
                )
                    unavailable++;
            }
            onProgress?.({ found: byKey.size, scanned });
            if (CFG.scanMaxMessages && scanned >= CFG.scanMaxMessages) break;
            offset = next;
            if (onCheckpoint && Date.now() - lastCheckpoint >= CFG.scanCheckpointMs) {
                lastCheckpoint = Date.now();
                await onCheckpoint({ offset, scanned, unavailable, entries: [...byKey.values()], groups: [...groups] });
            }
            // Short pages can occur before the end; continue until an empty page.
            await sleep(CFG.gapMs);
        }
        const entries = [...byKey.values()].sort((a, b) => a.rawId - b.rawId || a.key.localeCompare(b.key));
        backfillCaptions(entries, groups);
        dedupeNames(entries);
        return { entries, scanned, unavailable, scanComplete: complete };
    }

    const IDB = {
        async transaction(mode, action) {
            const db = await new Promise((resolve, reject) => {
                const r = indexedDB.open('tgbd', 1);
                r.onupgradeneeded = () => r.result.createObjectStore('kv');
                r.onsuccess = () => resolve(r.result);
                r.onerror = () => reject(r.error);
                r.onblocked = () => reject(new Error('IndexedDB is blocked.'));
            });
            try {
                return await new Promise((resolve, reject) => {
                    const tx = db.transaction('kv', mode);
                    const request = action(tx.objectStore('kv'));
                    tx.oncomplete = () => resolve(request.result);
                    tx.onerror = tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted.'));
                });
            } finally {
                db.close();
            }
        },
        get(key) {
            return this.transaction('readonly', (s) => s.get(key));
        },
        set(key, value) {
            return this.transaction('readwrite', (s) => s.put(value, key));
        },
        del(key) {
            return this.transaction('readwrite', (s) => s.delete(key));
        },
        keys() {
            return this.transaction('readonly', (s) => s.getAllKeys());
        },
    };
    const Store = {
        key: (accountId, peerId) => `job:v${JOB_VERSION}:${accountId}:${peerId}`,
        async setJob(job) {
            const key = this.key(job.accountId, job.peerId);
            try {
                await IDB.set(key, job);
                try {
                    localStorage.removeItem('tgbd:' + key);
                } catch {
                    /* IDB succeeded */
                }
            } catch {
                try {
                    localStorage.setItem('tgbd:' + key, JSON.stringify(job));
                } catch {
                    throw new Error(
                        'Could not save progress: browser storage is full or blocked. Export JSON before closing.',
                    );
                }
            }
        },
        async getJob(accountId, peerId) {
            const key = this.key(accountId, peerId),
                candidates = [];
            try {
                candidates.push(await IDB.get(key));
            } catch {
                /* fallback */
            }
            try {
                candidates.push(JSON.parse(localStorage.getItem('tgbd:' + key)));
            } catch {
                /* unavailable */
            }
            return (
                candidates
                    .filter((j) => j?.v === JOB_VERSION && Array.isArray(j.entries))
                    .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null
            );
        },
        async deleteJob(accountId, peerId) {
            const key = this.key(accountId, peerId);
            try {
                await IDB.del(key);
            } catch (e) {
                warn(e);
            }
            try {
                localStorage.removeItem('tgbd:' + key);
            } catch (e) {
                warn(e);
            }
            if (await this.getJob(accountId, peerId)) throw new Error('Saved job could not be discarded.');
        },
    };
    const summarizeJob = (job) => {
        const entries = job?.entries || [];
        const done = entries.filter((e) => e.status === 'ok').length;
        return {
            total: entries.length,
            done,
            left: entries.length - done,
            bytes: entries.reduce((n, e) => n + (e.size || 0), 0),
        };
    };
    function jobFromState() {
        return {
            v: JOB_VERSION,
            accountId: state.accountId,
            peerId: state.peerId,
            title: state.title,
            updatedAt: Date.now(),
            entries: state.entries,
            scanned: state.scanned,
            scanComplete: state.scanComplete,
            scanCheckpoint: state.scanCheckpoint,
            unavailable: state.unavailable,
            unfinished: !state.scanComplete || state.entries.some((e) => e.status !== 'ok'),
        };
    }
    function applyJob(job) {
        Object.assign(state, {
            accountId: job.accountId,
            peerId: job.peerId,
            title: job.title,
            entries: job.entries,
            scanned: job.scanned || 0,
            scanComplete: !!job.scanComplete,
            scanCheckpoint: job.scanCheckpoint || null,
            unavailable: job.unavailable || 0,
            unfinished: !!job.unfinished,
            bytes: job.entries.reduce((n, e) => n + (e.size || 0), 0),
        });
    }
    let saveTimer = null,
        saveChain = Promise.resolve(),
        storageWarning = false;
    function saveManifest() {
        if (!state.accountId || !state.peerId || saveTimer) return;
        saveTimer = setTimeout(() => {
            saveTimer = null;
            flushSave().catch((e) => ui.log(errorText(e)));
        }, 1000);
    }
    async function flushSave() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (!state.accountId || !state.peerId) return;
        const snapshot = structuredClone(jobFromState());
        saveChain = saveChain.catch(() => {}).then(() => Store.setJob(snapshot));
        try {
            await saveChain;
            storageWarning = false;
        } catch (e) {
            if (!storageWarning) ui.log(errorText(e));
            storageWarning = true;
            throw e;
        }
    }

    function fsSupported() {
        return typeof page.showDirectoryPicker === 'function';
    }
    async function pickFolder() {
        if (!fsSupported())
            throw new Error(
                'Folder downloads need a browser with showDirectoryPicker (for example desktop Chrome or Edge).',
            );
        // Called immediately in the click's task, before other awaited work.
        const handle = await page.showDirectoryPicker({ id: 'tgbd', mode: 'readwrite' });
        disk.handle = handle;
        try {
            await IDB.set('dir', handle);
        } catch {
            ui.log('Folder selected; this browser could not remember it for next time.');
        }
        ui.log(`Media will be written directly into: ${handle.name}`);
        ui.folder();
        return handle;
    }
    async function restoreFolder(request = false) {
        const handle = disk.handle || (await IDB.get('dir').catch(() => null));
        if (!handle) return null;
        const opts = { mode: 'readwrite' };
        const permission = await handle.queryPermission(opts);
        if (permission !== 'granted' && (!request || (await handle.requestPermission(opts)) !== 'granted')) return null;
        disk.handle = handle;
        ui.folder();
        return handle;
    }
    async function requireFolder() {
        const handle = await restoreFolder(true);
        if (handle) return handle;
        // Telling a Firefox or mobile user to click a button their browser cannot honour helps nobody.
        if (!fsSupported())
            throw new Error(
                'This browser cannot save into a folder: it has no showDirectoryPicker. Single files still download one at a time; whole-chat downloads need desktop Chrome or Edge.',
            );
        throw new Error('Click Pick folder first. Use a separate folder for each chat.');
    }
    async function fileInfo(handle, name) {
        try {
            const fh = await handle.getFileHandle(name);
            const file = await fh.getFile();
            return { size: file.size, actualName: file.name || name, handle: fh };
        } catch (e) {
            if (e.name === 'NotFoundError') return null;
            throw e;
        }
    }
    async function listFolder(handle) {
        const files = new Map();
        for await (const [name, entry] of handle.entries()) {
            checkStopped();
            if (entry.kind === 'file') files.set(name, { size: (await entry.getFile()).size, actualName: name });
            else files.set(name, { size: null, actualName: name, directory: true });
        }
        return files;
    }
    function classify(entries, files) {
        const s = { ok: 0, partial: 0, mismatch: 0, missing: 0, unverified: 0, bytesOnDisk: 0 };
        for (const e of entries) {
            const found = files.get(e.name);
            e.onDisk = found?.size ?? 0;
            e.actualName = found?.actualName || '';
            if (!found) e.status = 'missing';
            else if (found.directory) e.status = 'mismatch';
            else if (e.size == null) e.status = 'unverified';
            else if (found.size === e.size) e.status = 'ok';
            else e.status = found.size < e.size ? 'partial' : 'mismatch';
            s[e.status]++;
            if (found && !found.directory) s.bytesOnDisk += found.size;
            if (e.status === 'ok') e.error = '';
        }
        return s;
    }
    async function doVerify(quiet = false) {
        if (!state.entries.length) {
            ui.log('Scan this chat first.');
            return null;
        }
        const handle = await requireFolder();
        const summary = classify(state.entries, await listFolder(handle));
        saveManifest();
        if (!quiet)
            ui.log(
                `Size check: ${summary.ok} complete, ${summary.partial} short, ${summary.mismatch} mismatched, ${summary.missing} missing, ${summary.unverified} unknown size.`,
            );
        ui.renderSummary(summary);
        return summary;
    }
    async function loadCurrentJob() {
        const ctx = await getContext();
        if (state.peerId === ctx.peerId && state.accountId === ctx.accountId) return;
        await flushSave();
        const job = await Store.getJob(ctx.accountId, ctx.peerId);
        if (!job) throw new Error('Scan this chat first.');
        applyJob(job);
        state.context = ctx;
    }

    function captionText(e) {
        const lines = [e.name, e.date ? new Date(e.date * 1000).toISOString() : '', e.link || ''];
        if (e.sender) lines.push(`From: ${e.sender}`);
        if (e.size != null) lines.push(`Size: ${e.size} bytes`);
        if (e.groupedId) lines.push(`Album: ${e.groupedId}`);
        lines.push('', e.caption || '(no caption)');
        if (e.captionUrls?.length) lines.push('', 'Links:', ...e.captionUrls);
        return lines.join('\n') + '\n';
    }
    async function writeText(handle, name, text) {
        const fh = await handle.getFileHandle(name, { create: true });
        const writer = await fh.createWritable();
        try {
            checkStopped();
            await writer.write(text);
            checkStopped();
            await writer.close();
        } catch (e) {
            await writer.abort().catch(() => {});
            throw e;
        }
    }
    async function writeSidecars(entries = state.entries) {
        const root = await requireFolder();
        // The folder name carries the chat, never the user's account ID.
        const directory = `_tgbd-captions-${state.peerId}`;
        const handle = await root.getDirectoryHandle(directory, { create: true });
        let written = 0,
            failed = 0;
        for (const e of entries) {
            checkStopped();
            try {
                await writeText(handle, `${e.name}.txt`, captionText(e));
                written++;
            } catch (err) {
                checkStopped();
                failed++;
                ui.log(`Caption ${e.name}: ${errorText(err)}`);
            }
            ui.status(`Captions ${written + failed}/${entries.length}`);
        }
        // The index always covers the whole chat, even when only one file was just downloaded.
        await writeText(handle, '_captions.json', JSON.stringify(state.entries, null, 2));
        ui.log(`Captions: ${written} saved, ${failed} failed, in ${directory}/`);
        return { written, failed };
    }

    const meter = {
        samples: [],
        transferred: 0,
        completed: 0,
        totalBytes: 0,
        active: new Map(),
        timer: null,
        start(total) {
            this.stop();
            this.samples = [];
            this.transferred = 0;
            this.completed = 0;
            this.totalBytes = total;
            this.sample();
            this.timer = setInterval(() => {
                this.sample();
                ui.rate();
            }, 1000);
        },
        stop() {
            clearInterval(this.timer);
            this.timer = null;
            this.active.clear();
        },
        sample(now = Date.now()) {
            this.samples.push({ t: now, bytes: this.transferred });
            while (this.samples.length > 2 && this.samples[1].t < now - 30000) this.samples.shift();
        },
        speed() {
            const a = this.samples[0],
                b = this.samples.at(-1);
            return a && b.t - a.t >= 500 ? ((b.bytes - a.bytes) * 1000) / (b.t - a.t) : 0;
        },
        moved() {
            return this.completed + [...this.active.values()].reduce((a, b) => a + b, 0);
        },
        eta() {
            const v = this.speed();
            return v > 0 ? Math.max(0, this.totalBytes - this.moved()) / v : Infinity;
        },
    };

    async function fetchMessage(ctx, rawId) {
        const channel = ctx.inputPeer._ === 'inputPeerChannel' || ctx.inputPeer._ === 'inputPeerChannelFromMessage';
        const inputChannel =
            ctx.inputPeer._ === 'inputPeerChannelFromMessage'
                ? {
                      _: 'inputChannelFromMessage',
                      peer: ctx.inputPeer.peer,
                      msg_id: ctx.inputPeer.msg_id,
                      channel_id: ctx.inputPeer.channel_id,
                  }
                : { _: 'inputChannel', channel_id: ctx.inputPeer.channel_id, access_hash: ctx.inputPeer.access_hash };
        const result = await invoke(ctx, channel ? 'channels.getMessages' : 'messages.getMessages', {
            ...(channel ? { channel: inputChannel } : {}),
            id: [{ _: 'inputMessageID', id: rawId }],
        });
        const msg = result.messages?.find((m) => m.id === rawId && m._ !== 'messageEmpty');
        if (!msg) throw new Error('UNAVAILABLE: message was deleted or cannot be accessed.');
        return msg;
    }
    function sourceFor(msg, entry) {
        const item = mediaItems(msg).find((i) => i.isPhoto === entry.isPhoto && String(i.media.id) === entry.mediaId);
        if (!item) throw new Error('MEDIA_CHANGED: this attachment changed; rescan the chat.');
        const { media, isPhoto } = item;
        const thumb = isPhoto ? photoVariant(media) : null;
        const size = mediaSize(media, isPhoto);
        if (size == null || (isPhoto && !thumb))
            throw new Error('UNAVAILABLE: Telegram supplied no downloadable file size.');
        if (entry.size != null && entry.size !== size)
            throw new Error('MEDIA_CHANGED: attachment size changed; rescan the chat.');
        if (isPhoto && entry.thumbType && entry.thumbType !== thumb.type)
            throw new Error('MEDIA_CHANGED: photo variant changed; rescan the chat.');
        return {
            size,
            dcId: media.dc_id,
            inline: thumb?._ === 'photoCachedSize' ? Uint8Array.from(thumb.bytes) : null,
            location: {
                _: isPhoto ? 'inputPhotoFileLocation' : 'inputDocumentFileLocation',
                id: media.id,
                access_hash: media.access_hash,
                file_reference: media.file_reference,
                thumb_size: isPhoto ? thumb.type : '',
            },
        };
    }
    // Preserve mismatched existing files, and persist the replacement's name before writing.
    async function prepareTarget(entry, handle, reserved) {
        const existing = await fileInfo(handle, entry.name).catch((err) => {
            if (err.name === 'TypeMismatchError') return { size: null };
            throw err;
        });
        if (existing && existing.size === entry.size) {
            entry.name = existing.actualName;
            return { existing };
        }
        // An empty file holds nothing to preserve: it is what an interrupted run leaves behind, so it is reused.
        if (existing && existing.size !== 0) {
            const original = entry.name;
            let n = 0,
                name;
            do {
                name = suffixedName(original, `${entry.rawId}_retry${++n}`);
            } while (reserved.has(baseKey(name)));
            reserved.add(baseKey(name));
            entry.name = name;
            entry.replaces = original;
            ui.log(`Preserving ${original}; saving replacement as ${name}.`);
            await flushSave();
        }
        checkStopped();
        const fh = await handle.getFileHandle(entry.name, { create: true });
        // Recheck before opening a writable, including on case-insensitive file systems.
        if ((await fh.getFile()).size !== 0)
            throw new Error('UNAVAILABLE: target appeared during download; run Verify before retrying.');
        return { handle: fh };
    }
    // Without a folder (Firefox, mobile, or no folder picked yet) one file is assembled in memory
    // and handed to the browser's own downloader. The exact size is known up front, so
    // positioned writes land in a single buffer with no concatenation.
    function memoryTarget(entry, size) {
        if (size > CFG.blobLimitBytes) {
            throw new Error(
                `${entry.name} is ${fmtBytes(size)}; files over ${fmtBytes(CFG.blobLimitBytes)} need a folder. Pick one first (desktop Chrome or Edge).`,
            );
        }
        const buffer = new Uint8Array(size);
        let saved = false;
        return {
            handle: {
                async createWritable() {
                    return {
                        async write(part) {
                            buffer.set(part?.data ?? part, part?.position ?? 0);
                        },
                        async close() {
                            API.saveBlob(new Blob([buffer], { type: entry.mime }), entry.name);
                            saved = true;
                        },
                        async abort() {
                            saved = false;
                        },
                    };
                },
                async getFile() {
                    return { name: entry.name, size: saved ? size : 0 };
                },
            },
        };
    }
    async function downloadEntry(entry, ctx, handle, reserved) {
        let source = sourceFor(await fetchMessage(ctx, entry.rawId), entry);
        entry.size = source.size;
        const target = handle ? await prepareTarget(entry, handle, reserved) : memoryTarget(entry, source.size);
        if (target.existing) {
            Object.assign(entry, { status: 'ok', onDisk: source.size, actualName: entry.name, error: '' });
            return;
        }
        const writer = await target.handle.createWritable();
        let cursor = 0,
            transferred = 0,
            failure = null,
            refreshing = null,
            writeChain = Promise.resolve();
        meter.active.set(entry.key, 0);
        // One request at a time is latency-bound: throughput is one chunk per round trip, whatever
        // the line can do. Parts are fetched in parallel and written at their own offset, so they
        // may land out of order without buffering the file in memory.
        const fetchPart = (offset, expected) =>
            withRetry(async () => {
                if (source.inline) return source.inline.slice(offset, offset + expected);
                let result, failed;
                await acquireSlot();
                try {
                    await assertAccount(ctx);
                    result = await bounded(
                        ctx.managers.apiManager.invokeApi(
                            'upload.getFile',
                            toPage({ location: source.location, offset, limit: CFG.chunkBytes }),
                            toPage({ dcId: source.dcId, fileDownload: true, floodMaxTimeout: 0 }),
                        ),
                        `file chunk ${entry.name}`,
                    );
                } catch (err) {
                    failed = err;
                } finally {
                    releaseSlot();
                }
                if (failed) {
                    const err = failed;
                    // Every part in flight shares one refresh; a reference expires for the file, not the part.
                    // If the refresh itself fails (message deleted or edited), that is the real error.
                    if (/FILE_REFERENCE_(EXPIRED|INVALID)/.test(errorText(err))) {
                        refreshing =
                            refreshing ||
                            fetchMessage(ctx, entry.rawId)
                                .then((msg) => {
                                    source = sourceFor(msg, entry);
                                })
                                .finally(() => {
                                    refreshing = null;
                                });
                        await refreshing;
                    }
                    const migrate = /FILE_MIGRATE_(\d+)/.exec(errorText(err));
                    if (migrate) source.dcId = Number(migrate[1]);
                    throw err;
                }
                // cdn_supported is deliberately unset: request the original Telegram file.
                if (result?._ !== 'upload.file' || !result.bytes) throw new Error('Unexpected Telegram file response.');
                const bytes =
                    result.bytes instanceof ArrayBuffer ? new Uint8Array(result.bytes) : Uint8Array.from(result.bytes);
                if (bytes.length !== expected)
                    throw new Error(`Short or oversized chunk: expected ${expected}, received ${bytes.length}.`);
                return bytes;
            }, entry.name);
        // Each file may use every request slot; acquireSlot keeps the job as a whole within CFG.partsInFlight.
        const lanes = Array.from(
            { length: Math.min(CFG.partsInFlight, Math.ceil(source.size / CFG.chunkBytes) || 1) },
            async () => {
                try {
                    for (;;) {
                        if (failure) return;
                        checkStopped();
                        const offset = cursor;
                        if (offset >= source.size) return;
                        const expected = Math.min(CFG.chunkBytes, source.size - offset);
                        cursor = offset + expected;
                        const bytes = await fetchPart(offset, expected);
                        checkStopped();
                        // Positioned writes are parallel-safe, but the stream itself takes one at a time.
                        const write = writeChain.then(() =>
                            writer.write({ type: 'write', position: offset, data: bytes }),
                        );
                        writeChain = write.catch(() => {});
                        await write;
                        transferred += bytes.length;
                        meter.transferred += bytes.length;
                        meter.active.set(entry.key, transferred);
                    }
                } catch (err) {
                    failure = failure || err;
                    throw err;
                }
            },
        );
        try {
            const settled = await Promise.allSettled(lanes);
            // The first error is the cause; other lanes usually just stopped because of it.
            if (failure) throw failure;
            for (const result of settled) if (result.status === 'rejected') throw result.reason;
            await assertAccount(ctx);
            if (transferred !== source.size) throw new Error('Downloaded size differs from Telegram.');
            await writer.close();
            const file = await target.handle.getFile();
            if (file.size !== source.size) throw new Error('Saved size differs from Telegram.');
            Object.assign(entry, { status: 'ok', onDisk: file.size, actualName: entry.name, error: '' });
        } catch (err) {
            await writer.abort().catch(() => {});
            // prepareTarget created the file before writing; a failed or cancelled download leaves nothing behind.
            if (handle && (await target.handle.getFile().catch(() => null))?.size === 0)
                await handle.removeEntry(entry.name).catch(() => {});
            throw err;
        } finally {
            meter.active.delete(entry.key);
        }
    }
    async function runPool(items, worker) {
        let cursor = 0;
        // allSettled keeps the busy guard held until every lane has stopped.
        const results = await Promise.allSettled(
            Array.from({ length: Math.min(CFG.concurrency, items.length) }, async () => {
                while (!state.cancel) {
                    const i = cursor++;
                    if (i >= items.length) return;
                    await worker(items[i]);
                    await sleep(CFG.gapMs);
                }
            }),
        );
        const error = results.find((r) => r.status === 'rejected');
        if (error) throw error.reason;
    }
    async function downloadBatch(entries, ctx, handle, files) {
        const reserved = new Set([...files.keys(), ...state.entries.map((e) => e.name)].map(baseKey));
        Object.assign(state, { total: entries.length, done: 0, ok: 0, fail: 0, errors: [], phase: 'download' });
        meter.start(entries.reduce((n, e) => n + (e.size || 0), 0));
        ui.status(`Downloading 0/${entries.length}`);
        try {
            await runPool(entries, async (entry) => {
                try {
                    await downloadEntry(entry, ctx, handle, reserved);
                    state.ok++;
                    meter.completed += entry.size || 0;
                } catch (err) {
                    entry.error = errorText(err);
                    entry.status = state.cancel ? 'pending' : 'error';
                    if (entry.error !== 'cancelled') {
                        state.fail++;
                        state.errors.push({ name: entry.name, error: entry.error });
                        ui.log(`${entry.name}: ${entry.error}`);
                    }
                    if (/TIMEOUT|ACCOUNT_CHANGED|NotAllowedError|SecurityError|QuotaExceededError/.test(entry.error)) {
                        cancel();
                        throw err;
                    }
                } finally {
                    state.done++;
                    meter.sample();
                    ui.rate();
                    ui.status(`Downloading ${state.done}/${state.total} · ${state.fail} failed`);
                    saveManifest();
                }
            });
        } finally {
            meter.stop();
        }
    }

    // Every limit lives here once: validateConfig enforces it and the settings form shows it.
    const RANGES = {
        concurrency: [1, 5],
        partsInFlight: [1, 8],
        retries: [1, 10],
        scanPageSize: [1, 100],
        scanMaxMessages: [0, Number.MAX_SAFE_INTEGER],
        scanCheckpointMs: [0, 3600000],
        gapMs: [0, 60000],
        retryBaseMs: [0, 60000],
        floodMaxWaitMs: [0, 86400000],
        requestTimeoutMs: [1000, 900000],
        internalsTimeoutMs: [1000, 900000],
        blobLimitBytes: [1048576, 8 * 1024 ** 3],
    };
    const FILTERS = ['all', 'video', 'audio', 'voice', 'round', 'photo', 'gif', 'sticker', 'doc'];
    function validateConfig(cfg = CFG) {
        for (const [key, [min, max]] of Object.entries(RANGES)) {
            if (!Number.isSafeInteger(cfg[key]) || cfg[key] < min || cfg[key] > max)
                throw new Error(`Invalid ${key}; expected ${min}–${max}.`);
        }
        if (
            !Number.isSafeInteger(cfg.chunkBytes) ||
            cfg.chunkBytes < 4096 ||
            cfg.chunkBytes > 1048576 ||
            1048576 % cfg.chunkBytes
        )
            throw new Error('chunkBytes must divide 1 MiB and be at least 4 KiB.');
        if (!FILTERS.includes(cfg.filter)) throw new Error('Unknown media filter.');
        for (const key of ['captionSidecars', 'inlineButtons', 'debug'])
            if (typeof cfg[key] !== 'boolean') throw new Error(`Invalid ${key}; expected true or false.`);
    }

    // What the Settings panel offers. `debug` is deliberately absent: it exposes the API to the page.
    const SETTINGS = [
        { key: 'concurrency', label: 'Files at once' },
        { key: 'partsInFlight', label: 'Parallel requests (whole job)' },
        { key: 'gapMs', label: 'Pause between files', unit: 'ms' },
        { key: 'retries', label: 'Attempts per request' },
        { key: 'floodMaxWaitMs', label: 'Longest rate-limit wait', unit: 'min', scale: 60000 },
        { key: 'requestTimeoutMs', label: 'Request timeout', unit: 's', scale: 1000 },
        { key: 'blobLimitBytes', label: 'Biggest file without a folder', unit: 'MB', scale: 1048576 },
        { key: 'captionSidecars', label: 'Save captions as text files', bool: true },
        { key: 'inlineButtons', label: 'Show ↓ button on files', bool: true },
    ];
    const PERSISTED = [...SETTINGS.map((s) => s.key), 'filter'];
    const DEFAULTS = { ...CFG };
    const PRESETS = {
        Safe: { concurrency: 1, partsInFlight: 2, gapMs: 1000 },
        Balanced: { concurrency: 3, partsInFlight: 4, gapMs: 200 },
        Fast: { concurrency: 5, partsInFlight: 8, gapMs: 0 },
    };
    // Userscript storage survives Telegram clearing its own site data.
    const prefs = {
        read() {
            try {
                return typeof GM_getValue === 'function' ? GM_getValue('settings', null) : null;
            } catch {
                return null;
            }
        },
        write(value) {
            if (typeof GM_setValue === 'function') GM_setValue('settings', value);
        },
    };
    // All or nothing: an invalid change throws and leaves CFG exactly as it was.
    function applySettings(changes) {
        const next = { ...CFG, ...changes };
        validateConfig(next);
        Object.assign(CFG, next);
        prefs.write(Object.fromEntries(PERSISTED.map((k) => [k, CFG[k]])));
    }
    function loadSettings() {
        const saved = prefs.read();
        if (!saved || typeof saved !== 'object') return '';
        try {
            applySettings(Object.fromEntries(PERSISTED.filter((k) => k in saved).map((k) => [k, saved[k]])));
            return '';
        } catch (e) {
            return `Saved settings were invalid and were ignored (${errorText(e)}). Defaults are in use.`;
        }
    }
    async function runAction(action, lock = true) {
        if (state.running) {
            ui.log('A task is already running. Cancel it before starting another.');
            return false;
        }
        state.running = true;
        state.cancel = false;
        state.controller = new AbortController();
        ui.setBusy(true);
        const execute = async () => {
            try {
                validateConfig();
                return await action();
            } finally {
                try {
                    await flushSave();
                } catch {
                    /* already reported */
                }
            }
        };
        try {
            if (lock && typeof navigator !== 'undefined' && navigator.locks) {
                return await navigator.locks.request('tgbd-download-writer', { ifAvailable: true }, (held) => {
                    if (!held) throw new Error('Another Telegram tab is using the downloader. Let it finish first.');
                    return execute();
                });
            }
            // Without Web Locks nothing stops a second tab; run one downloader tab at a time.
            return await execute();
        } catch (err) {
            ui.log(errorText(err) === 'cancelled' ? 'Cancelled. Finished files are kept.' : `Error: ${errorText(err)}`);
            return false;
        } finally {
            meter.stop();
            state.unfinished = !state.scanComplete || state.entries.some((e) => e.status !== 'ok');
            state.running = false;
            state.cancel = false;
            state.controller = null;
            state.phase = 'idle';
            ui.setBusy(false);
            ui.status('Idle');
            ui.rate();
            ui.refreshResume().catch(() => {});
        }
    }
    // The header names the open chat only; any other chat keeps its stored title.
    function chatTitle(peerId) {
        if (Number(page.appImManager?.chat?.peerId) !== Number(peerId)) return '';
        return $('.chat-info .peer-title, .chat-info .user-title')?.textContent.trim() || '';
    }
    async function doScan(force = false, ctx) {
        ctx = ctx || (await getContext());
        await flushSave();
        const saved = await Store.getJob(ctx.accountId, ctx.peerId);
        const checkpoint = saved?.scanCheckpoint || null;
        if (!force && saved?.scanComplete && !checkpoint) {
            applyJob(saved);
            state.context = ctx;
            ui.log(`Loaded ${saved.entries.length} attachments. Disk will be checked again; Rescan finds new posts.`);
            return saved.entries;
        }
        const title = chatTitle(ctx.peerId) || saved?.title || String(ctx.peerId);
        // Checkpoints are saved through the normal job record, so state must describe this chat while scanning.
        applyJob(saved || { accountId: ctx.accountId, peerId: ctx.peerId, title, entries: [] });
        state.context = ctx;
        state.phase = 'scan';
        ui.log(
            checkpoint
                ? `Resuming the interrupted scan: ${checkpoint.scanned} messages already read.`
                : 'Scanning full history, including audio, voice messages, GIFs, stickers and arbitrary files…',
        );
        const scan = await scanChannel(
            ctx,
            ({ found, scanned }) => ui.status(`Scanning ${scanned} messages · ${found} attachments`),
            undefined,
            checkpoint,
            async (cp) => {
                state.scanCheckpoint = cp;
                await flushSave();
            },
        );
        // An unchanged attachment keeps its file name and last known disk status; a rescan must not
        // make finished files look pending (reports and the Resume box read these until the next disk check).
        const old = new Map((saved?.entries || []).map((e) => [e.key, e]));
        for (const e of scan.entries) {
            const previous = old.get(e.key);
            if (previous && previous.size === e.size) {
                const { name, replaces, status, onDisk, actualName, error } = previous;
                Object.assign(e, { name, replaces, status, onDisk, actualName, error });
            }
        }
        dedupeNames(scan.entries);
        applyJob({
            ...scan,
            peerId: ctx.peerId,
            accountId: ctx.accountId,
            title,
            unfinished: true,
            scanCheckpoint: null,
        });
        state.context = ctx;
        await flushSave();
        ui.log(
            `${scan.scanComplete ? 'Scan complete' : 'INCOMPLETE SCAN: message limit reached'}: ${scan.entries.length} attachments in ${scan.scanned} messages.`,
        );
        if (scan.unavailable)
            ui.log(
                `${scan.unavailable} message(s) contain locked or unsupported media; those attachments cannot be downloaded.`,
            );
        return scan.entries;
    }
    async function downloadCurrent(entries, ctx, handle) {
        const files = await listFolder(handle);
        classify(entries, files);
        const todo = entries.filter((e) => e.status !== 'ok');
        ui.log(`${entries.length - todo.length} already match the expected size; ${todo.length} to download.`);
        await downloadBatch(todo, ctx, handle, files);
        checkStopped();
        const summary = classify(entries, await listFolder(handle));
        ui.renderSummary(summary);
        const left = entries.filter((e) => e.status !== 'ok').length;
        ui.log(
            left
                ? `${left} selected attachment(s) remain incomplete. See Export report; run again to retry.`
                : `All ${entries.length} selected attachments match their expected byte size.`,
        );
        if (!state.scanComplete)
            ui.log('This job is not a complete channel scan. Use Rescan to enumerate the full history.');
        // Captions for files this run saved; More tools → "Save captions as text" rewrites all of them.
        const fresh = todo.filter((e) => e.status === 'ok');
        if (CFG.captionSidecars && fresh.length) await writeSidecars(fresh);
    }
    function runAll() {
        if (state.running) {
            cancel();
            return Promise.resolve(false);
        }
        return runAction(async () => {
            const handle = await requireFolder();
            const ctx = await getContext();
            await doScan(false, ctx);
            await downloadCurrent(
                state.entries.filter((e) => matchesFilter(e)),
                ctx,
                handle,
            );
        });
    }
    function discardJob() {
        return runAction(async () => {
            const ctx = await getContext();
            await flushSave();
            await Store.deleteJob(ctx.accountId, ctx.peerId);
            if (state.accountId === ctx.accountId && state.peerId === ctx.peerId) {
                Object.assign(state, {
                    peerId: null,
                    accountId: null,
                    entries: [],
                    context: null,
                    scanComplete: false,
                    scanCheckpoint: null,
                });
            }
            ui.log('Saved job discarded. Downloaded files are kept.');
        });
    }
    async function entriesForSelection(ctx, messages) {
        const all = [],
            groups = new Map();
        for (const m of messages) {
            const raw = await fetchMessage(ctx, m.id);
            const cap = captionParts(raw),
                gid = String(raw.grouped_id || raw.groupedId || '');
            if (gid && cap.text) groups.set(gid, cap);
            all.push(...manifestEntries(raw, ctx.peerId));
        }
        const unique = [...new Map(all.map((e) => [e.key, e])).values()].sort((a, b) => a.rawId - b.rawId);
        backfillCaptions(unique, groups);
        dedupeNames(unique);
        return unique;
    }
    // No folder: one file at a time, straight to the browser's downloads.
    async function downloadToBrowser(entries, ctx) {
        if (entries.length !== 1)
            throw new Error(
                'Without folder access only one file at a time can be saved. Select a single attachment, or use desktop Chrome or Edge for whole-chat downloads.',
            );
        // A copy: the saved job describes the folder, and this file goes to the browser's Downloads instead.
        const entry = { ...entries[0] };
        Object.assign(state, { total: 1, done: 0, ok: 0, fail: 0, errors: [], phase: 'download' });
        meter.start(entry.size || 0);
        try {
            await downloadEntry(entry, ctx, null, new Set());
            state.ok++;
            meter.completed += entry.size || 0;
            ui.log(`Saved to your browser downloads: ${entry.name}`);
        } catch (err) {
            entry.error = errorText(err);
            entry.status = state.cancel ? 'pending' : 'error';
            state.fail++;
            state.errors.push({ name: entry.name, error: entry.error });
            throw err;
        } finally {
            state.done++;
            meter.stop();
            ui.rate();
        }
        return [entry];
    }
    function downloadSelectedMedia(single) {
        return runAction(async () => {
            // Batches need a folder. A single file uses the remembered folder when there is one,
            // and otherwise goes to the browser's downloads instead of failing.
            const handle = single ? await restoreFolder(true).catch(() => null) : await requireFolder();
            const im = await waitFor('appImManager');
            const ctx = await getContext(single?.peerId);
            if (single?.accountId && single.accountId !== ctx.accountId)
                throw new Error('ACCOUNT_CHANGED: reopen the file in the original account.');
            const messages = single
                ? [
                      single.rawId
                          ? { id: single.rawId }
                          : await bounded(
                                (await waitFor('mtprotoMessagePort')).getMessageByPeer(ctx.peerId, Number(single.mid)),
                                'message lookup',
                            ),
                  ]
                : await bounded(im.chat.selection.getSelectedMessages(), 'selection');
            if (!messages?.length || messages.some((m) => !m)) throw new Error('No selected message is available.');
            let selected = await entriesForSelection(ctx, Array.from(messages));
            if (single) {
                selected = selected.filter((e) => e.key === single.key);
                if (selected.length !== 1)
                    throw new Error('MEDIA_CHANGED: reopen the file popup and select the attachment again.');
            }
            await flushSave();
            const job = await Store.getJob(ctx.accountId, ctx.peerId);
            const byKey = new Map((job?.entries || []).map((e) => [e.key, e]));
            for (const e of selected) if (!byKey.has(e.key)) byKey.set(e.key, e);
            const entries = dedupeNames([...byKey.values()]);
            applyJob({
                ...job,
                entries,
                peerId: ctx.peerId,
                accountId: ctx.accountId,
                title: chatTitle(ctx.peerId) || job?.title || String(ctx.peerId),
            });
            state.context = ctx;
            await flushSave();
            const chosen = selected.map((e) => byKey.get(e.key));
            await (handle ? downloadCurrent(chosen, ctx, handle) : downloadToBrowser(chosen, ctx));
            return chosen;
        });
    }

    const MEDIA_SELECTOR =
        'video,audio,img,audio-element,.attachment,.document,.media-round,.media-gif-wrapper,.media-container,.grouped-item,.album-item,.sticker-wrapper,[data-doc-id],[data-photo-id],.photo:not(.bubble),.video:not(.bubble),.audio:not(.bubble),.voice-message:not(.bubble),.sticker:not(.bubble)';
    function mediaTarget(element, requireMedia = true) {
        if (
            !element?.closest ||
            element.closest(
                '#tgbd-panel,#tgbd-single,#tgbd-wrap,#bubble-contextmenu,.tgbd-inline,.reply,.bubble-reply,.avatar,avatar-element,.emoji,.custom-emoji,reactions-element,.reactions',
            )
        )
            return null;
        if (requireMedia && !element.closest(MEDIA_SELECTOR)) return null;
        // Album tiles have their own mid; never substitute the enclosing album's mid.
        const owner = element.closest('[data-mid]');
        if (!owner) return null;
        const mid = Number(owner.dataset.mid);
        const peerId = Number(
            owner.dataset.peerId || owner.closest('[data-peer-id]')?.dataset.peerId || page.appImManager?.chat?.peerId,
        );
        if (!Number.isSafeInteger(mid) || mid <= 0 || !Number.isSafeInteger(peerId) || !peerId) return null;
        const identity = element.closest('[data-doc-id],[data-photo-id]');
        const index = element.closest('.album-item[data-index]')?.dataset.index;
        return {
            peerId,
            mid,
            mediaId: identity?.dataset.docId || identity?.dataset.photoId,
            isPhoto: identity ? identity.dataset.photoId != null && identity.dataset.docId == null : undefined,
            index: index == null ? undefined : Number(index),
        };
    }
    function clickedEntry(entries, target, msg) {
        let matches = entries;
        if (target.mediaId != null)
            matches = entries.filter(
                (e) => e.mediaId === String(target.mediaId) && (target.isPhoto == null || e.isPhoto === target.isPhoto),
            );
        else if (Number.isInteger(target.index)) {
            const item = msg.media?.extended_media?.[target.index]?.media;
            if (!item) return null;
            const keys = new Set(manifestEntries({ ...msg, media: item }, target.peerId).map((e) => e.key));
            matches = entries.filter((e) => keys.has(e.key));
        }
        return matches.length === 1 ? matches[0] : null;
    }
    const singlePopup = { token: 0, entry: null, accountId: null, downloading: false, lastMessage: '' };
    async function openMediaPopup(target) {
        if (!target || singlePopup.downloading) return;
        let popup = $('#tgbd-single');
        if (!popup) {
            popup = document.createElement('section');
            popup.id = 'tgbd-single';
            popup.setAttribute('role', 'dialog');
            popup.setAttribute('aria-labelledby', 'tgbd-single-title');
            popup.innerHTML = `<div class="tgbd-single-head"><b id="tgbd-single-title">Download this file</b><button id="tgbd-single-close" aria-label="Close file download">✕</button></div>
<p id="tgbd-single-name"></p><label id="tgbd-single-choice" hidden>Choose one attachment<select id="tgbd-single-files"></select></label>
<div id="tgbd-single-folder-name"></div>
<progress id="tgbd-single-progress" max="1" value="0" hidden aria-label="Download progress"></progress><div id="tgbd-single-rate"></div>
<div id="tgbd-single-status" role="status"></div>
<div class="tgbd-single-actions"><button id="tgbd-single-folder">Pick folder</button><button id="tgbd-single-download">Download this file</button></div>`;
            document.body.appendChild(popup);
            $('#tgbd-single-close').onclick = () => {
                popup.hidden = true;
                singlePopup.token++;
            };
            $('#tgbd-single-folder').onclick = async () => {
                const handle = await API.pickFolder();
                if (handle) $('#tgbd-single-status').textContent = 'Ready to download into the selected folder.';
            };
            $('#tgbd-single-download').onclick = async () => {
                if (!singlePopup.entry || state.running) return;
                const entry = singlePopup.entry,
                    token = singlePopup.token;
                const button = $('#tgbd-single-download'),
                    progress = $('#tgbd-single-progress');
                singlePopup.downloading = true;
                singlePopup.lastMessage = '';
                button.textContent = 'Downloading…';
                button.classList.add('tgbd-busy');
                progress.hidden = false;
                progress.removeAttribute('value');
                $('#tgbd-single-status').textContent = `Downloading started: ${entry.name}`;
                popup.classList.add('tgbd-active');
                try {
                    const result = await downloadSelectedMedia({
                        peerId: entry.peerId,
                        rawId: entry.rawId,
                        key: entry.key,
                        accountId: singlePopup.accountId,
                    });
                    if (token === singlePopup.token)
                        $('#tgbd-single-status').textContent =
                            result?.[0]?.status === 'ok'
                                ? `Saved: ${result[0].name}`
                                : singlePopup.lastMessage || 'Download did not finish. Try again.';
                } finally {
                    singlePopup.downloading = false;
                    button.textContent = 'Download this file';
                    button.classList.remove('tgbd-busy');
                    progress.hidden = true;
                    $('#tgbd-single-rate').textContent = '';
                    popup.classList.remove('tgbd-active');
                }
            };
            popup.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    popup.hidden = true;
                    singlePopup.token++;
                    e.stopPropagation();
                }
            });
        }
        const token = ++singlePopup.token;
        singlePopup.entry = null;
        popup.hidden = false;
        $('#tgbd-single-folder').hidden = !fsSupported();
        $('#tgbd-single-name').textContent = 'Loading attachment…';
        $('#tgbd-single-choice').hidden = true;
        $('#tgbd-single-status').textContent = '';
        ui.folder();
        ui.setBusy(state.running);
        try {
            const ctx = await getContext(target.peerId);
            const cached = await bounded(
                (await waitFor('mtprotoMessagePort')).getMessageByPeer(ctx.peerId, target.mid),
                'message lookup',
            );
            if (!cached?.id) throw new Error('Message is unavailable. Reopen the chat and try again.');
            const msg = await fetchMessage(ctx, cached.id);
            const entries = dedupeNames(manifestEntries(msg, ctx.peerId));
            if (token !== singlePopup.token) return;
            if (!entries.length) throw new Error('This message has no accessible file attachment.');
            singlePopup.accountId = ctx.accountId;
            const chosen = clickedEntry(entries, target, msg);
            const select = $('#tgbd-single-files');
            select.replaceChildren();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Select one file…';
            select.appendChild(placeholder);
            for (const e of entries) {
                const option = document.createElement('option');
                option.value = e.key;
                option.textContent = e.name;
                select.appendChild(option);
            }
            const choose = (entry) => {
                singlePopup.entry = entry || null;
                $('#tgbd-single-name').textContent = entry
                    ? `${entry.name} · ${entry.size == null ? 'unknown size' : fmtBytes(entry.size)}`
                    : 'This message has multiple attachments. Choose the file to download.';
                ui.setBusy(state.running);
            };
            select.value = chosen?.key || '';
            select.onchange = () => choose(entries.find((e) => e.key === select.value));
            $('#tgbd-single-choice').hidden = !!chosen;
            choose(chosen);
            $('#tgbd-single-status').textContent = state.running
                ? 'Another task is running. Wait until it finishes.'
                : disk.handle
                  ? 'Only the selected attachment will be downloaded.'
                  : 'No folder picked: the file will go to your browser downloads.';
        } catch (err) {
            if (token !== singlePopup.token) return;
            $('#tgbd-single-name').textContent = 'File unavailable';
            $('#tgbd-single-status').textContent = errorText(err);
        }
    }

    function saveBlob(blob, filename) {
        const url = URL.createObjectURL(blob),
            a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                return document.execCommand('copy');
            } finally {
                ta.remove();
            }
        }
    }
    // Safe to paste into a public issue: no account ID, chat, folder name, file names or captions.
    function debugBundle() {
        const redact = (text, name) =>
            name
                ? String(text || '')
                      .split(name)
                      .join('<file>')
                : String(text || '');
        return {
            version: VERSION,
            running: state.running,
            phase: state.phase,
            scanComplete: state.scanComplete,
            scanResumable: !!state.scanCheckpoint,
            scanned: state.scanned,
            unavailable: state.unavailable,
            folderPicked: !!disk.handle,
            folderAccess: fsSupported(),
            ...summarizeJob(jobFromState()),
            cfg: { ...CFG },
            problems: state.entries
                .filter((e) => e.status !== 'ok')
                .slice(0, 50)
                .map((e) => ({
                    kind: e.kind,
                    size: e.size,
                    onDisk: e.onDisk,
                    status: e.status,
                    error: redact(e.error, e.name),
                })),
            errors: state.errors.map((e) => redact(e.error, e.name)),
        };
    }
    // Exports go through API.saveBlob, like the no-folder download path, so there is one way files leave the page.
    function exportManifest() {
        API.saveBlob(
            new Blob([JSON.stringify(jobFromState(), null, 2)], { type: 'application/json' }),
            `tgbd-manifest-${state.peerId}.json`,
        );
    }
    function exportReport() {
        const rows = state.entries
            .map(
                (e) =>
                    `<tr><td>${e.rawId}</td><td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.kind)}</td><td>${e.size ?? '?'}</td><td>${e.onDisk ?? 0}</td><td>${escapeHtml(e.status)}</td><td>${escapeHtml(e.error || '')}</td></tr>`,
            )
            .join('');
        const html = `<!doctype html><meta charset="utf-8"><title>TGBD ${escapeHtml(state.title)}</title>
<style>body{font:14px system-ui;margin:2rem}table{border-collapse:collapse;width:100%}th,td{padding:.5rem;border:1px solid #aaa;text-align:left}</style>
<h1>${escapeHtml(state.title)}</h1><p>Full history scanned: ${state.scanComplete ? 'yes' : 'NO'} · ${state.unavailable} locked/unsupported message(s). Completion checks exact file size, not a content checksum.</p>
<table><thead><tr><th>Message</th><th>File</th><th>Type</th><th>Expected bytes</th><th>Disk bytes</th><th>Status</th><th>Error</th></tr></thead><tbody>${rows}</tbody></table>`;
        API.saveBlob(new Blob([html], { type: 'text/html' }), `tgbd-report-${state.peerId}.html`);
    }

    const ui = {
        mount() {
            if ($('#tgbd-panel')) return;
            const panel = document.createElement('section');
            panel.id = 'tgbd-panel';
            panel.setAttribute('aria-label', 'Telegram Media Batch Downloader');
            panel.innerHTML = `<div id="tgbd-head"><b>Media Batch Downloader ${VERSION}</b><button id="tgbd-close" aria-label="Close downloader">✕</button></div>
<div id="tgbd-resume" hidden><span id="tgbd-resume-text"></span><button id="tgbd-do-resume">Resume</button><button id="tgbd-discard">Discard job</button></div>
<div class="tgbd-step"><b>Step 1 · Where to save</b><div id="tgbd-folder-name">Pick a folder for this chat.</div><button id="tgbd-folder">Pick folder</button></div>
<div class="tgbd-step"><b>Step 2 · What to download</b><label for="tgbd-filter">Attachment types</label><select id="tgbd-filter">
<option value="all">Everything (all file formats)</option><option value="video">Videos + video messages</option><option value="audio">Audio + voice messages</option>
<option value="photo">Photos / images</option><option value="voice">Voice messages</option><option value="round">Video messages</option><option value="gif">GIFs / animations</option>
<option value="sticker">Stickers / custom emoji files</option><option value="doc">Other files</option></select></div>
<div class="tgbd-step"><b>Step 3 · Download</b><button id="tgbd-run" class="tgbd-primary">Scan &amp; download all</button>
<small>Reads this chat's whole history and saves every attachment of the chosen type. For one file instead: use the ↓ button on that file, right-click it and pick <b>Download this file</b>, or open it and use ↓ in the viewer.</small></div>
<div id="tgbd-status" role="status">Idle</div>
<progress id="tgbd-progress" max="1" value="0" aria-label="Download progress"></progress><div id="tgbd-rate"></div><div id="tgbd-sum"></div>
<details id="tgbd-settings-box"><summary>Settings</summary><fieldset id="tgbd-settings"></fieldset><div id="tgbd-settings-msg" role="status"></div></details>
<details id="tgbd-more"><summary>More tools</summary><div id="tgbd-actions">
<button id="tgbd-rescan">Rescan for new posts</button><button id="tgbd-verify">Check saved files</button><button id="tgbd-captions">Save captions as text</button>
<button id="tgbd-report">Export report (HTML)</button><button id="tgbd-manifest">Export file list (JSON)</button>
<button id="tgbd-copy-debug">Copy debug info (safe to share)</button><button id="tgbd-copy-json">Copy job JSON (private)</button></div></details><div id="tgbd-console" role="log"></div>`;
            document.body.appendChild(panel);
            const fab = document.createElement('button');
            fab.id = 'tgbd-fab';
            fab.textContent = '↓';
            fab.title = 'Media Batch Downloader';
            fab.setAttribute('aria-label', fab.title);
            fab.onclick = () => {
                panel.classList.toggle('open');
                ui.refreshResume().catch(() => {});
            };
            document.body.appendChild(fab);
            $('#tgbd-close').onclick = () => panel.classList.remove('open');
            $('#tgbd-run').onclick = runAll;
            $('#tgbd-rescan').onclick = () => runAction(() => doScan(true));
            $('#tgbd-folder').onclick = () => runAction(pickFolder);
            $('#tgbd-verify').onclick = () => API.verify();
            $('#tgbd-captions').onclick = () => API.writeSidecars();
            $('#tgbd-do-resume').onclick = runAll;
            $('#tgbd-discard').onclick = discardJob;
            $('#tgbd-filter').value = CFG.filter;
            $('#tgbd-filter').onchange = (e) => {
                ui.changeSettings({ filter: e.target.value });
                ui.log('Filter applies to downloads. The saved scan includes all attachments.');
                ui.refreshResume().catch(() => {});
            };
            $('#tgbd-report').onclick = exportReport;
            $('#tgbd-manifest').onclick = exportManifest;
            const copy = async (value) => {
                try {
                    ui.log(
                        (await copyText(JSON.stringify(value, null, 2)))
                            ? 'Copied.'
                            : 'Clipboard unavailable; use Export JSON.',
                    );
                } catch (e) {
                    ui.log(errorText(e));
                }
            };
            $('#tgbd-copy-debug').onclick = () => copy(debugBundle());
            $('#tgbd-copy-json').onclick = () => copy(jobFromState());
            ui.buildSettings();
        },
        // Built once; syncSettings refreshes values in place so keyboard focus is never lost.
        buildSettings() {
            const box = $('#tgbd-settings');
            const presets = document.createElement('div');
            presets.className = 'tgbd-presets';
            presets.setAttribute('role', 'group');
            presets.setAttribute('aria-label', 'Speed preset');
            const title = document.createElement('span');
            title.textContent = 'Speed';
            presets.appendChild(title);
            for (const [name, values] of Object.entries(PRESETS)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = name;
                btn.dataset.preset = name;
                btn.onclick = () =>
                    ui.changeSettings(
                        values,
                        `${name} speed applied.${name === 'Fast' ? ' Expect more rate-limit pauses on busy accounts.' : ''}`,
                    );
                presets.appendChild(btn);
            }
            box.appendChild(presets);
            for (const s of SETTINGS) {
                const row = document.createElement('label'),
                    text = document.createElement('span'),
                    input = document.createElement('input');
                row.className = 'tgbd-setting';
                input.id = 'tgbd-set-' + s.key;
                text.textContent = s.unit ? `${s.label} (${s.unit})` : s.label;
                if (s.bool) {
                    input.type = 'checkbox';
                    input.onchange = () => ui.changeSettings({ [s.key]: input.checked });
                } else {
                    const scale = s.scale || 1,
                        [min, max] = RANGES[s.key];
                    Object.assign(input, {
                        type: 'number',
                        inputMode: 'numeric',
                        step: 1,
                        min: Math.ceil(min / scale),
                        max: Math.floor(max / scale),
                    });
                    input.onchange = () => {
                        const n = Number(input.value),
                            lo = Number(input.min),
                            hi = Number(input.max);
                        if (input.value === '' || !Number.isInteger(n) || n < lo || n > hi) {
                            input.setAttribute('aria-invalid', 'true');
                            $('#tgbd-settings-msg').textContent =
                                `${s.label}: enter a whole number from ${lo} to ${hi}. Nothing was changed.`;
                            return;
                        }
                        input.removeAttribute('aria-invalid');
                        ui.changeSettings({ [s.key]: n * scale });
                    };
                }
                row.append(text, input);
                box.appendChild(row);
            }
            const reset = document.createElement('button');
            reset.type = 'button';
            reset.textContent = 'Reset to defaults';
            reset.onclick = () =>
                ui.changeSettings(
                    Object.fromEntries(PERSISTED.map((k) => [k, DEFAULTS[k]])),
                    'Settings reset to defaults.',
                );
            box.appendChild(reset);
            ui.syncSettings();
        },
        syncSettings() {
            for (const s of SETTINGS) {
                const input = $('#tgbd-set-' + s.key);
                if (!input) continue;
                if (s.bool) input.checked = CFG[s.key];
                else {
                    input.value = Math.round(CFG[s.key] / (s.scale || 1));
                    input.removeAttribute('aria-invalid');
                }
            }
            for (const btn of document.querySelectorAll('#tgbd-settings [data-preset]')) {
                btn.setAttribute(
                    'aria-pressed',
                    String(Object.entries(PRESETS[btn.dataset.preset]).every(([k, v]) => CFG[k] === v)),
                );
            }
            const filter = $('#tgbd-filter');
            if (filter) filter.value = CFG.filter;
        },
        changeSettings(changes, done = 'Saved.') {
            const msg = $('#tgbd-settings-msg');
            try {
                applySettings(changes);
                if (msg) msg.textContent = done;
            } catch (e) {
                if (msg) msg.textContent = `Not saved: ${errorText(e)}`;
            }
            if (CFG.inlineButtons) syncItemButtons();
            else document.querySelectorAll('.tgbd-inline').forEach((b) => b.remove());
            ui.syncSettings();
        },
        status(text) {
            const el = $('#tgbd-status');
            if (el) el.textContent = text;
            const single = $('#tgbd-single-status');
            if (single && singlePopup.downloading) single.textContent = text;
        },
        folder() {
            for (const id of ['#tgbd-folder-name', '#tgbd-single-folder-name']) {
                const el = $(id);
                if (el)
                    el.textContent = disk.handle
                        ? `Save media into: ${disk.handle.name}`
                        : 'Pick a folder for this chat.';
            }
        },
        setBusy(busy) {
            // Settings are locked while a task runs, so a job never changes speed or limits halfway.
            for (const id of ['rescan', 'folder', 'verify', 'captions', 'do-resume', 'discard', 'filter', 'settings']) {
                const el = $('#tgbd-' + id);
                if (el) el.disabled = busy;
            }
            const run = $('#tgbd-run');
            if (run) run.textContent = busy ? 'Cancel' : 'Scan & download all';
            for (const id of ['folder', 'files', 'download']) {
                const el = $('#tgbd-single-' + id);
                if (el) el.disabled = busy || (id === 'download' && !singlePopup.entry);
            }
        },
        renderSummary(s) {
            const el = $('#tgbd-sum');
            if (el)
                el.textContent = `${s.ok} complete · ${s.partial + s.mismatch} size mismatch · ${s.missing} missing · ${s.unverified} unknown`;
        },
        rate() {
            const el = $('#tgbd-rate'),
                progress = $('#tgbd-progress');
            const text = meter.timer
                ? `${fmtSpeed(meter.speed())} · ETA ${fmtEta(meter.eta())} · ${fmtBytes(meter.moved())} / ${fmtBytes(meter.totalBytes)}`
                : '';
            const share = state.running
                ? Math.min(
                      1,
                      meter.totalBytes ? meter.moved() / meter.totalBytes : state.done / Math.max(1, state.total),
                  )
                : 0;
            if (el) el.textContent = text;
            if (progress) progress.value = share;
            const single = $('#tgbd-single-progress'),
                rate = $('#tgbd-single-rate');
            if (single && singlePopup.downloading) {
                single.hidden = false;
                single.value = share;
            }
            if (rate && singlePopup.downloading) rate.textContent = text;
        },
        log(text) {
            if (singlePopup.downloading) singlePopup.lastMessage = text;
            if (CFG.debug) console.log('[TGBD]', text);
            const box = $('#tgbd-console');
            if (!box) return;
            const line = document.createElement('div');
            line.textContent = `${new Date().toLocaleTimeString()}  ${text}`;
            box.appendChild(line);
            while (box.childElementCount > 80) box.firstElementChild.remove();
            box.scrollTop = box.scrollHeight;
        },
        async refreshResume() {
            if (state.running || !$('#tgbd-resume')) return;
            const ctx = await getContext();
            const job = await Store.getJob(ctx.accountId, ctx.peerId);
            if (state.running || (await currentPeerId()) !== ctx.peerId) return;
            const box = $('#tgbd-resume'),
                relevant = (job?.entries || []).filter((e) => matchesFilter(e));
            const left = relevant.filter((e) => e.status !== 'ok').length;
            const kind = $('#tgbd-filter')?.selectedOptions[0]?.textContent || 'attachments';
            box.hidden = !job || (!left && job.scanComplete && !job.scanCheckpoint);
            $('#tgbd-resume-text').textContent = job
                ? `${left}/${relevant.length} unfinished (${kind}) in ${job.title}.${job.scanCheckpoint ? ' Scan was interrupted and will resume.' : job.scanComplete ? '' : ' Full scan still needed.'}`
                : '';
        },
    };
    let lastTarget = null,
        menuTarget = null;
    // Any element the script can resolve to an attachment gets a button: chat bubbles, album
    // tiles, document rows and the shared-media lists all carry the same data-mid markers.
    const INLINE_HOSTS =
        '.attachment.media-container,.document,.audio-element,.media-round,.media-gif-wrapper,.album-item,.search-super-item,.document-container';
    // Static hosts never take a button; remembering them keeps getComputedStyle out of every mutation pass.
    const staticHosts = new WeakSet();
    function syncItemButtons() {
        if (!CFG.inlineButtons) return;
        for (const host of document.querySelectorAll(INLINE_HOSTS)) {
            if (staticHosts.has(host) || host.querySelector(':scope > .tgbd-inline') || !mediaTarget(host)) continue;
            // Never restyle Telegram's own elements: making a static host relative re-anchors its
            // absolutely positioned children (.document-ico, .document-download, search rows) and
            // breaks their layout. Hosts that are already positioned take the button; the rest keep
            // the context-menu entry and the viewer button.
            if (getComputedStyle(host).position === 'static') {
                staticHosts.add(host);
                continue;
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tgbd-inline';
            btn.textContent = '↓';
            btn.title = 'Download this file';
            btn.setAttribute('aria-label', btn.title);
            // Telegram recycles these nodes, so the attachment is resolved at click time.
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = mediaTarget(host);
                if (target) {
                    lastTarget = target;
                    openMediaPopup(target);
                }
            };
            host.appendChild(btn);
        }
    }
    // Long-press on touch never fires contextmenu, so the menu is caught as it appears.
    function syncContextMenuButton() {
        const menu = $('#bubble-contextmenu');
        if (!menu || !menuTarget) return;
        const list = menu.querySelector('.btn-menu-items') || menu;
        let btn = menu.querySelector('#tgbd-ctx-btn');
        if (!btn) {
            btn = document.createElement('div');
            btn.id = 'tgbd-ctx-btn';
            btn.className = 'btn-menu-item rp-overflow';
            btn.setAttribute('role', 'menuitem');
            btn.tabIndex = 0;
            const icon = document.createElement('span'),
                text = document.createElement('span');
            // Telegram's own icons are private font code points that change between builds; a plain arrow does not.
            icon.className = 'btn-menu-item-icon';
            icon.textContent = '↓';
            icon.setAttribute('aria-hidden', 'true');
            icon.style.cssText = 'font:600 1.25rem/1 system-ui;display:flex;align-items:center;justify-content:center';
            text.className = 'btn-menu-item-text';
            text.textContent = 'Download this file';
            btn.append(icon, text);
            btn.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            };
        }
        // A direct child of .btn-menu renders under the reactions bar; items live in the wrapper.
        if (btn.parentElement !== list) list.prepend(btn);
        const target = menuTarget;
        btn.onclick = () => {
            // Escape closes only Telegram's topmost layer, the menu; the chat and our popup stay.
            document.body.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }),
            );
            openMediaPopup(target);
        };
    }
    // Telegram's mobile search and composer own the bottom of the screen; the launcher must not sit on top.
    function syncChrome() {
        const fab = $('#tgbd-fab');
        if (!fab) return;
        const active = document.activeElement;
        const typing =
            active && /^(INPUT|TEXTAREA)$/.test(active.tagName) && !active.closest('#tgbd-panel,#tgbd-single');
        fab.style.display = typing && matchMedia('(max-width:600px)').matches ? 'none' : '';
    }
    let viewerMedia = null;
    function syncViewerButton() {
        const viewer = $('.media-viewer-whole.active');
        const media = viewer?.querySelector('.media-viewer-movers .media-viewer-aspecter') || null;
        // Closing the viewer or swiping to another file ends what lastTarget describes.
        if (viewerMedia && media !== viewerMedia) {
            lastTarget = null;
            viewerMedia = null;
        }
        if (viewer && lastTarget) viewerMedia = viewerMedia || media;
        if (!viewer || !lastTarget) {
            $('#tgbd-viewer-btn')?.remove();
            return;
        }
        if ($('#tgbd-viewer-btn')) return;
        const bar = viewer.querySelector('.media-viewer-topbar .media-viewer-buttons');
        if (!bar) return;
        const btn = document.createElement('button');
        btn.id = 'tgbd-viewer-btn';
        btn.className = 'btn-icon';
        btn.textContent = '↓';
        btn.title = 'Download this file';
        btn.setAttribute('aria-label', btn.title);
        btn.onclick = () => openMediaPopup(lastTarget);
        bar.prepend(btn);
    }
    function syncBatchButton() {
        const bar = $('.chat-input-main.is-selecting');
        if (!bar) {
            $('#tgbd-wrap')?.remove();
            return;
        }
        if ($('#tgbd-wrap')) return;
        const wrap = document.createElement('div');
        wrap.id = 'tgbd-wrap';
        const btn = document.createElement('button');
        btn.textContent = 'Download selected messages';
        btn.id = 'tgbd-btn';
        btn.onclick = () => (state.running ? cancel() : downloadSelectedMedia());
        wrap.appendChild(btn);
        (bar.querySelector('.chat-input-main-container') || bar).appendChild(wrap);
    }
    // The downloader needs Web K internals. Web A users are asked, not redirected.
    function showWebANotice() {
        const note = document.createElement('div');
        note.setAttribute('role', 'status');
        // Web A names its theme colours differently from Web K (--color-*), so the notice follows those.
        note.style.cssText =
            'position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:320px;padding:12px;border-radius:10px;background:var(--color-background,#212121);color:var(--color-text,#eee);font:13px system-ui;box-shadow:0 8px 28px rgba(0,0,0,.3)';
        note.textContent = 'Media Batch Downloader only works in Telegram Web K.';
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:8px;margin-top:10px';
        for (const [label, colors, onClick] of [
            [
                'Switch to Web K',
                'background:var(--color-primary,#3390ec);color:#fff',
                () => location.replace(location.href.replace('.org/a/', '.org/k/')),
            ],
            [
                'Not now',
                'background:var(--color-background-secondary,#383838);color:var(--color-text,#eee)',
                () => note.remove(),
            ],
        ]) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = label;
            btn.onclick = onClick;
            btn.style.cssText = `padding:7px 10px;border:0;border-radius:6px;${colors};font:inherit;cursor:pointer`;
            actions.appendChild(btn);
        }
        note.appendChild(actions);
        document.body.appendChild(note);
    }
    function boot() {
        if (location.pathname.startsWith('/a/')) {
            showWebANotice();
            return;
        }
        if (!location.pathname.startsWith('/k/')) return;
        GM_addStyle(`
            /* Colours follow Telegram's own theme (day, night, tinted); the fallbacks are the old dark look. */
            #tgbd-panel,
            #tgbd-single,
            #tgbd-fab,
            #tgbd-wrap {
                --tgbd-surface: var(--surface-color, #212121);
                --tgbd-text: var(--primary-text-color, #eee);
                --tgbd-muted: var(--secondary-text-color, #aaa);
                --tgbd-accent: var(--primary-color, #3390ec);
                --tgbd-danger: var(--danger-color, #e5534b);
                --tgbd-card: color-mix(in srgb, var(--tgbd-text) 6%, var(--tgbd-surface));
                --tgbd-control: color-mix(in srgb, var(--tgbd-text) 12%, var(--tgbd-surface));
                --tgbd-line: color-mix(in srgb, var(--tgbd-text) 20%, var(--tgbd-surface));
                --tgbd-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
            }

            /* Launcher and panel */
            #tgbd-fab {
                position: fixed;
                right: 18px;
                bottom: 88px;
                z-index: 100000;
                width: 44px;
                height: 44px;
                border: 0;
                border-radius: 50%;
                font-size: 26px;
                background: var(--tgbd-accent);
                color: #fff;
                cursor: pointer;
                box-shadow: var(--tgbd-shadow);
            }
            #tgbd-panel {
                position: fixed;
                right: 18px;
                bottom: 140px;
                z-index: 100000;
                width: min(370px, calc(100vw - 36px));
                max-height: 75vh;
                overflow: auto;
                box-sizing: border-box;
                display: none;
                flex-direction: column;
                gap: 9px;
                padding: 12px;
                border: 1px solid var(--tgbd-line);
                border-radius: 12px;
                background: var(--tgbd-surface);
                color: var(--tgbd-text);
                box-shadow: var(--tgbd-shadow);
                font: 13px system-ui;
            }
            #tgbd-panel.open {
                display: flex;
            }
            /* The panel scrolls; its sections must never shrink (a styled progress bar would collapse to 0px). */
            #tgbd-panel > * {
                flex-shrink: 0;
            }
            #tgbd-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            #tgbd-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .tgbd-step {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 9px;
                border-radius: 8px;
                background: var(--tgbd-card);
            }
            .tgbd-step > b {
                font-size: 11px;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: var(--tgbd-muted);
            }
            .tgbd-step small {
                color: var(--tgbd-muted);
                line-height: 1.4;
            }
            .tgbd-step label {
                font-size: 12px;
                color: var(--tgbd-muted);
            }
            #tgbd-more > summary {
                cursor: pointer;
                color: var(--tgbd-muted);
                padding: 4px 0;
            }
            #tgbd-more #tgbd-actions {
                margin-top: 6px;
            }
            #tgbd-panel button,
            #tgbd-btn,
            #tgbd-filter {
                padding: 7px 9px;
                border: 0;
                border-radius: 6px;
                color: var(--tgbd-text);
                background: var(--tgbd-control);
                cursor: pointer;
                font: inherit;
            }
            #tgbd-btn {
                box-shadow: var(--tgbd-shadow);
            }
            #tgbd-panel button:disabled,
            #tgbd-filter:disabled {
                opacity: 0.45;
                cursor: default;
            }
            #tgbd-panel button:focus-visible,
            #tgbd-filter:focus-visible,
            #tgbd-btn:focus-visible {
                outline: 2px solid var(--tgbd-accent);
                outline-offset: 1px;
            }
            #tgbd-filter,
            #tgbd-run {
                flex-basis: 100%;
                width: 100%;
            }
            #tgbd-panel .tgbd-primary {
                background: var(--tgbd-accent);
                color: #fff;
            }
            #tgbd-resume {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
                padding: 8px;
                background: color-mix(in srgb, var(--tgbd-accent) 14%, transparent);
                border-radius: 6px;
            }
            #tgbd-resume[hidden] {
                display: none !important;
            }
            #tgbd-folder-name,
            #tgbd-rate {
                font-size: 12px;
                overflow-wrap: anywhere;
            }
            #tgbd-rate,
            #tgbd-sum {
                color: var(--tgbd-muted);
            }
            #tgbd-progress,
            #tgbd-single-progress {
                width: 100%;
                -webkit-appearance: none;
                appearance: none;
                border: 0;
                background: var(--tgbd-control);
                color: var(--tgbd-accent);
            }
            #tgbd-progress::-webkit-progress-bar,
            #tgbd-single-progress::-webkit-progress-bar {
                background: var(--tgbd-control);
                border-radius: 3px;
            }
            #tgbd-progress::-webkit-progress-value,
            #tgbd-single-progress::-webkit-progress-value {
                background: var(--tgbd-accent);
                border-radius: 3px;
            }
            #tgbd-progress::-moz-progress-bar,
            #tgbd-single-progress::-moz-progress-bar {
                background: var(--tgbd-accent);
            }
            #tgbd-console {
                max-height: 180px;
                overflow: auto;
                border-top: 1px solid var(--tgbd-line);
                padding-top: 6px;
                color: var(--tgbd-muted);
                font:
                    11px ui-monospace,
                    monospace;
                overflow-wrap: anywhere;
            }

            /* "Download selected messages" button in Telegram's selection bar */
            #tgbd-wrap {
                position: absolute;
                right: 55px;
                top: -50px;
                z-index: 9999;
            }

            /* Single-file popup */
            #tgbd-single {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 2147483647;
                width: min(370px, calc(100vw - 36px));
                box-sizing: border-box;
                padding: 14px;
                border: 1px solid var(--tgbd-line);
                border-radius: 12px;
                background: var(--tgbd-surface);
                color: var(--tgbd-text);
                box-shadow: var(--tgbd-shadow);
                font: 13px system-ui;
                overflow-wrap: anywhere;
            }
            #tgbd-single[hidden],
            #tgbd-single [hidden] {
                display: none !important;
            }
            .tgbd-single-head,
            .tgbd-single-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }
            .tgbd-single-actions {
                margin-top: 12px;
            }
            #tgbd-single button,
            #tgbd-single select {
                padding: 8px 10px;
                border: 0;
                border-radius: 6px;
                background: var(--tgbd-control);
                color: var(--tgbd-text);
                font: inherit;
                cursor: pointer;
            }
            #tgbd-single select {
                display: block;
                max-width: 100%;
                margin: 8px 0;
            }
            #tgbd-single #tgbd-single-download {
                background: var(--tgbd-accent);
                color: #fff;
            }
            #tgbd-single button:disabled,
            #tgbd-single select:disabled {
                opacity: 0.45;
                cursor: default;
            }
            #tgbd-single button:focus-visible,
            #tgbd-single select:focus-visible {
                outline: 2px solid var(--tgbd-accent);
                outline-offset: 1px;
            }
            #tgbd-single-folder-name,
            #tgbd-single-rate {
                font-size: 12px;
                color: var(--tgbd-muted);
                margin: 8px 0;
            }
            #tgbd-single-rate {
                margin: 4px 0;
            }

            /* Buttons added to Telegram: media viewer and the ↓ on attachments */
            #tgbd-viewer-btn {
                width: 40px;
            }
            .tgbd-inline {
                position: absolute;
                top: 6px;
                right: 6px;
                z-index: 5;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                padding: 0;
                border: 0;
                border-radius: 50%;
                background: #000000cc;
                color: #fff;
                font: 16px/1 system-ui;
                cursor: pointer;
                opacity: 0.75;
                box-shadow: 0 1px 4px #0006;
                transition:
                    opacity 0.15s ease,
                    transform 0.15s ease;
            }
            .tgbd-inline:hover {
                background: var(--primary-color, #3390ec);
            }
            .tgbd-inline:focus-visible {
                outline: 2px solid #fff;
                outline-offset: 1px;
            }
            *:hover > .tgbd-inline,
            .tgbd-inline:focus-visible {
                opacity: 1;
            }
            .document > .tgbd-inline,
            .document-container > .tgbd-inline,
            .search-super-item > .tgbd-inline {
                top: 50%;
                margin-top: -15px;
            }
            #tgbd-single {
                animation: tgbd-rise 0.18s ease-out;
            }
            #tgbd-single.tgbd-active {
                border-color: var(--tgbd-accent);
            }
            #tgbd-single-progress,
            #tgbd-progress {
                height: 6px;
                border-radius: 3px;
                overflow: hidden;
                transition: opacity 0.2s;
            }

            /* Busy state and motion */
            .tgbd-busy {
                position: relative;
                opacity: 0.85 !important;
            }
            .tgbd-busy::after {
                content: '';
                position: absolute;
                right: 9px;
                top: 50%;
                width: 11px;
                height: 11px;
                margin-top: -6px;
                border: 2px solid #ffffff60;
                border-top-color: #fff;
                border-radius: 50%;
                animation: tgbd-spin 0.7s linear infinite;
            }
            #tgbd-fab {
                transition:
                    transform 0.15s ease,
                    box-shadow 0.15s ease;
            }
            #tgbd-fab:hover {
                transform: scale(1.08);
            }
            #tgbd-fab:focus-visible {
                outline: 2px solid var(--tgbd-text);
                outline-offset: 2px;
            }
            #tgbd-panel button,
            #tgbd-btn {
                transition:
                    background 0.15s ease,
                    transform 0.1s ease;
            }
            #tgbd-panel button:active,
            #tgbd-btn:active {
                transform: scale(0.97);
            }
            @keyframes tgbd-spin {
                to {
                    transform: rotate(360deg);
                }
            }
            @keyframes tgbd-rise {
                from {
                    opacity: 0;
                    transform: translateY(12px);
                }
                to {
                    opacity: 1;
                    transform: none;
                }
            }

            /* Touch screens and phones */
            @media (hover: none) {
                .tgbd-inline {
                    opacity: 0.9;
                }
            }
            @media (max-width: 600px) {
                #tgbd-single,
                #tgbd-panel {
                    right: 0;
                    left: 0;
                    bottom: 0;
                    width: auto;
                    max-width: 100%;
                    border-radius: 14px 14px 0 0;
                }
                #tgbd-panel {
                    bottom: 0;
                    max-height: 80vh;
                }
                #tgbd-fab {
                    right: 12px;
                    bottom: 76px;
                    width: 52px;
                    height: 52px;
                }
                #tgbd-single button,
                #tgbd-panel button,
                #tgbd-filter {
                    min-height: 44px;
                }
                .tgbd-single-actions {
                    flex-wrap: wrap;
                }
                .tgbd-single-actions button {
                    flex: 1 1 140px;
                }
                .tgbd-inline {
                    width: 34px;
                    height: 34px;
                    font-size: 18px;
                }
                #tgbd-panel.open ~ #tgbd-fab {
                    display: none;
                }
            }

            /* Settings section */
            #tgbd-settings-box > summary {
                cursor: pointer;
                color: var(--tgbd-muted);
                padding: 4px 0;
            }
            #tgbd-settings {
                display: flex;
                flex-direction: column;
                gap: 6px;
                min-width: 0;
                margin: 6px 0 0;
                padding: 0;
                border: 0;
            }
            #tgbd-settings:disabled {
                opacity: 0.5;
            }
            .tgbd-presets {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 6px;
            }
            .tgbd-presets > span {
                font-size: 12px;
                color: var(--tgbd-muted);
                margin-right: auto;
            }
            #tgbd-panel .tgbd-presets button[aria-pressed='true'] {
                background: var(--tgbd-accent);
                color: #fff;
            }
            .tgbd-setting {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                font-size: 12px;
            }
            .tgbd-setting input[type='number'] {
                width: 84px;
                box-sizing: border-box;
                padding: 6px;
                border: 1px solid var(--tgbd-line);
                border-radius: 6px;
                background: var(--tgbd-card);
                color: var(--tgbd-text);
                font: inherit;
            }
            .tgbd-setting input[type='checkbox'] {
                position: static !important;
                opacity: 1 !important;
                -webkit-appearance: checkbox !important;
                appearance: auto !important;
                pointer-events: auto !important;
                flex: none;
                width: 18px;
                height: 18px;
                margin: 0;
                accent-color: var(--tgbd-accent);
            }
            .tgbd-setting input:focus-visible {
                outline: 2px solid var(--tgbd-accent);
                outline-offset: 1px;
            }
            .tgbd-setting input[aria-invalid='true'] {
                border-color: var(--tgbd-danger);
            }
            #tgbd-settings-msg {
                font-size: 12px;
                color: var(--tgbd-muted);
                overflow-wrap: anywhere;
            }
            @media (max-width: 600px) {
                .tgbd-setting input[type='number'] {
                    min-height: 44px;
                }
            }

            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                #tgbd-single,
                .tgbd-inline,
                #tgbd-fab,
                #tgbd-panel button {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `);
        const settingsNotice = loadSettings();
        ui.mount();
        if (settingsNotice) ui.log(settingsNotice);
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            setTimeout(() => {
                queued = false;
                syncBatchButton();
                syncViewerButton();
                syncItemButtons();
                syncContextMenuButton();
                syncChrome();
            }, 100);
        }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
        syncItemButtons(); // Anything already rendered must not wait for the next mutation.
        document.addEventListener('focusin', syncChrome, true);
        document.addEventListener('focusout', () => setTimeout(syncChrome, 50), true);
        // A plain click only remembers which file the viewer is showing, for its ↓ button.
        // It opens no popup and makes no API call; that happens only when a ↓ button is used.
        document.addEventListener(
            'click',
            (e) => {
                if (
                    e.button !== 0 ||
                    e.ctrlKey ||
                    e.metaKey ||
                    e.shiftKey ||
                    e.altKey ||
                    $('.chat-input-main.is-selecting')
                )
                    return;
                if (e.target?.closest?.('.media-viewer-switcher,.media-viewer-sibling-button')) {
                    lastTarget = null;
                    syncViewerButton();
                    return;
                }
                // Clicks inside the viewer (including our own button) never change which file it shows.
                if (e.target?.closest?.('.media-viewer-whole')) return;
                // Anything else, an avatar included, replaces it, so the viewer can't offer a stale file.
                lastTarget = mediaTarget(e.target);
            },
            true,
        );
        document.addEventListener(
            'pointerdown',
            (e) => {
                menuTarget = mediaTarget(e.target, false);
            },
            true,
        );
        document.addEventListener(
            'contextmenu',
            (e) => {
                const target = mediaTarget(e.target, false);
                if (target) {
                    menuTarget = target;
                    syncContextMenuButton();
                }
            },
            true,
        );
        // Paging the viewer moves to another file; drop the button rather than save the wrong one.
        document.addEventListener(
            'keydown',
            (e) => {
                if (lastTarget && String(e.key || '').startsWith('Arrow')) {
                    lastTarget = null;
                    syncViewerButton();
                }
            },
            true,
        );
        window.addEventListener('beforeunload', (e) => {
            if (state.running) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        restoreFolder(false).catch((e) => ui.log(errorText(e)));
        ui.refreshResume().catch(() => {});
        let lastPeer = null;
        setInterval(() => {
            const peer = page.appImManager?.chat?.peerId;
            if (!state.running && peer !== lastPeer) {
                lastPeer = peer;
                ui.refreshResume().catch(() => {});
            }
        }, 2000);
    }

    function selfTest() {
        const assert = (v, label) => {
            if (!v) throw new Error(label);
        };
        assert(baseKey('a (1).mp4') !== baseKey('a.mp4'), 'Real numbered filenames must stay distinct');
        const clash = dedupeNames([
            { name: 'a.mp4', rawId: 1 },
            { name: 'a.mp4', rawId: 2 },
            { name: 'a_2.mp4', rawId: 3 },
        ]);
        assert(new Set(clash.map((e) => baseKey(e.name))).size === 3, 'Generated names must not collide');
        const e = { name: 'a.mp4', size: 100 };
        classify([e], new Map([['a.mp4', { size: 101 }]]));
        assert(e.status === 'mismatch', 'Oversized files must not verify');
        assert(
            summarizeJob({ entries: [{ status: 'missing', mediaId: 'a' }], doneKeys: ['a'] }).left === 1,
            'Queue history must not override disk status',
        );
        assert(new TextEncoder().encode(sanitize('😀'.repeat(100))).length <= 180, 'Filenames must fit UTF-8 limits');
        return true;
    }
    const API = {
        VERSION,
        CFG,
        state,
        ui,
        disk,
        Store,
        IDB,
        meter,
        runAll,
        cancel,
        resumeJob: runAll,
        discardJob,
        scan: (force = true) => runAction(() => doScan(force)),
        verify: () =>
            runAction(async () => {
                await loadCurrentJob();
                return doVerify();
            }),
        pickFolder: () => runAction(pickFolder),
        writeSidecars: () =>
            runAction(async () => {
                await loadCurrentJob();
                return writeSidecars();
            }),
        writeSidecarFiles: writeSidecars,
        downloadSelectedMedia,
        exportManifest,
        exportReport,
        copyText,
        saveBlob,
        debugBundle,
        selfTest,
        flushSave,
        summarizeJob,
        buildName,
        sanitize,
        baseKey,
        dedupeNames,
        classify,
        mediaItems,
        mediaKind,
        mediaSize,
        manifestEntries,
        matchesFilter,
        captionText,
        captionParts,
        entityUrls,
        backfillCaptions,
        scanChannel,
        sourceFor,
        getContext,
        downloadEntry,
        runPool,
        withRetry,
        runAction,
        mediaTarget,
        clickedEntry,
        openMediaPopup,
        fmtBytes,
        fmtSpeed,
        fmtEta,
        applySettings,
        loadSettings,
        validateConfig,
        escapeHtml,
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
    else {
        // The page (and anything else running on it) can reach the API only while debugging.
        if (CFG.debug) page.TGBD = API;
        if (document.body) boot();
        else document.addEventListener('DOMContentLoaded', boot, { once: true });
    }
})();
