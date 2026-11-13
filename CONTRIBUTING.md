# Contributing

Thanks for helping out! Bug fixes and small, focused improvements are the easiest to merge.

## Setup

There's nothing to install. You need Node 22+ and a browser with Tampermonkey.

```
node --test                         # logic, download engine and security tests
npx prettier@3.3.3 --write .        # formatting
```

To try a change in Telegram, open `telegram-batch-downloader.user.js` in Tampermonkey's editor (or serve the folder
locally and open the file's URL), then reload [web.telegram.org/k](https://web.telegram.org/k/) with a real reload, not
just a change after `#`.

## Ground rules

-   **One file.** The script stays a single `.user.js` with no build step and no dependencies.
-   **No new reach.** No new `@grant`, `@require`, `@connect`, network calls or `innerHTML` built from data. The security
    tests enforce this. If you truly need one, explain why in the PR.
-   **Untrusted input.** Treat everything from Telegram (file names, captions, sizes) as untrusted.
-   **Tests with behaviour.** Changes to the download engine come with a test in `test/download.test.js`. It has a fake
    Telegram API and folder you can reuse.
-   **Test with your own media.** Don't put other people's content in issues, PRs or screenshots.

## Reviews

Pull requests get an automatic review from CodeRabbit and must pass CI (tests, formatting, CodeQL). A human review
decides.
