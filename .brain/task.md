# Current Active Task: Phase 3: Local File System (Tauri FS)

**Objective:**
Integrate Tauri FS and Path plugins to read and write local markdown files, creating a "Vault" file explorer in the sidebar.

**Requirements:**
- [x] Enable `fs`, `os` and `dialog` plugins.
- [x] Implement a Tauri command or frontend API call to list `.md` files in a chosen base directory (the "Vault").
- [x] Display the directory contents in the React Sidebar layout.
- [x] Create functions to read the contents of an active file into Tiptap, and save changes back to the filesystem on "debounce" or explicit save.
- [ ] *NOTE:* Validate the file system integration inside the native Tauri context (`bun run tauri dev`), as pure browser environments cannot execute the native IPC calls.

**Status:** DONE
