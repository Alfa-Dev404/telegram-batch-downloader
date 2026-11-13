# Roadmap

Planned work, roughly in priority order. Ideas and pull requests for any of these are welcome; please open an issue first so we can agree on the approach.

## Next

-   **Telegram Web A support.** The biggest gap compared to other downloaders. Web A uses different internals from Web K, so this needs its own adapter for finding messages and fetching files.
-   **Translated panel.** The Greasy Fork listing is translated into 17 languages, but the panel itself is English only. Start with the languages that already have a listing translation.
-   **Stories.** Download stories from the story viewer, like single files today.

## Later

-   **Finished-job notification.** A browser notification and a tab title change when a long download completes.
-   **More filters.** Limit a whole-chat download by date range or file size, for example "only files under 100 MB" or "posts since March".
-   **Firefox and mobile.** Folder downloads need the File System Access API, which these browsers lack. Look into a zip-based fallback for small batches.
-   **Code structure.** Split the three longest functions (`downloadEntry`, `openMediaPopup`, `boot`) the next time they need changes.

## Done

-   1.0.1: name and description translated into 17 languages; Greasy Fork listing with automatic updates.
-   1.0.0: whole-chat, selection and single-file downloads; folder writes; resume; exact size checks; captions; settings panel; theme support; tests, CI and CodeQL.
