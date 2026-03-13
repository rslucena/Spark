# Future Tasks Queue (Daily Work Backlog)

This file acts as the single source of truth for the daily task scheduler. Each task is a stepping stone to building Spark.

**Status:**
- [ ] Todo
- [x] Done
- [-] Blocked / Needs Refinement

---

## 🛠️ Phase 1: Bootstrap & Foundation

- [x] **1.1 Bootstrap Tauri v2:** Create the core structure using `npm create tauri-app@latest`. Choose React, TypeScript, and Vite.
- [x] **1.2 Configure Tailwind CSS:** Install Tailwind CSS, PostCSS, and Autoprefixer. Configure `tailwind.config.js` and add base styles to `src/index.css`.
- [x] **1.3 Add Framer Motion:** Install `framer-motion` for React micro-interactions.
- [x] **1.4 UI Architecture Setup:** Create folders: `src/components`, `src/hooks`, `src/utils`, `src/layouts`.
- [x] **1.5 Basic Layout:** Create a split-pane layout (Sidebar + Main Editor Area) using Tailwind flexbox/grid.

## ✍️ Phase 2: Core Editor Integration (Tiptap)

- [x] **2.1 Install Tiptap Core:** Install `@tiptap/react`, `@tiptap/pm`, and `@tiptap/starter-kit`.
- [x] **2.2 Implement Tiptap Editor:** Create the main `Editor` component that renders a WYSIWYG surface.
- [x] **2.3 Markdown Parsing:** Install `tiptap-markdown` so that content is saved as standard Markdown text.
- [x] **2.4 Toolbar UI:** Create a sticky toolbar with buttons for bold, italic, headings, lists, and quotes.

## 📂 Phase 3: Local File System (Tauri FS)

- [x] **3.1 FS Setup:** Enable `fs` and `path` plugins in `src-tauri/tauri.conf.json`.
- [x] **3.2 Directory Navigation:** Implement a Tauri command to list `.md` files in a chosen base directory (the "Vault").
- [x] **3.3 Sidebar Render:** Display the directory contents in the React Sidebar layout.
- [x] **3.4 File I/O Bindings:** Create functions to read the contents of an active file into Tiptap, and save changes back to the filesystem on "debounce" or explicit save.

## 🔄 Phase 4: Auto-Git Sync (Rust / git2)

- [x] **4.1 Add git2 Dependency:** Add the `git2` crate to `src-tauri/Cargo.toml`.
- [x] **4.2 Git Commands Setup:** Write Rust functions (Tauri commands) for:
  - `git_status`: Check for changes.
  - `git_commit`: Create a timestamped commit (includes staging).
- [ ] **4.3 Remote Sync Setup:** Write Rust functions for:
  - `git_push`: Push changes to remote.
  - `git_pull`: Fetch and merge changes from remote.
- [ ] **4.4 Lifecycle Hooks:** Call `git_pull` securely on application start. Create a background worker or an on-close hook to trigger a commit/push.

## ✨ Phase 5: UI/UX Polish

- [ ] **5.1 Obsidian Theme:** Style the UI to mimic a premium note-taking app (dark mode by default, subtle borders, focused editor view).
- [ ] **5.2 Fluid Transitions:** Use Framer Motion to animate opening/closing sidebars, loading states, and toast notifications.
- [ ] **5.3 Settings Panel:** Add a configuration view to manage the "Vault" path and Git credentials (remote URL, PAT).
