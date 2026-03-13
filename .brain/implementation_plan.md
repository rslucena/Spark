# Implementation Plan: Spark (Local-First Knowledge Management)

This document outlines the overarching plan to build the Spark application using Tauri v2, React, Tailwind CSS, Framer Motion, and Tiptap.

## Phase 0: Code Health & Maintenance
1. [x] Remove boilerplate comments from `src-tauri/src/lib.rs`.

## Phase 1: Project Bootstrap
1. [x] Initialize a Tauri v2 project with a React + TypeScript frontend using Vite.
2. [x] Configure Tailwind CSS and Framer Motion for styling and micro-interactions.
3. [x] Set up the basic directory structure for the frontend (`src/components`, `src/hooks`, `src/pages`, etc.).

## Phase 2: Core Editor Integration
1. [ ] Install and configure Tiptap for a WYSIWYG Markdown editing experience.
2. [ ] Create the main editor component.
3. [ ] Implement basic text formatting, headings, lists, and code blocks.

## Phase 3: Local File System (Tauri FS)
1. [ ] Configure Tauri's `fs` and `path` APIs.
2. [ ] Implement file reading and writing mechanisms.
3. [ ] Build a sidebar file explorer to navigate local markdown files.
4. [ ] Bind the active file in the explorer to the Tiptap editor state.

## Phase 4: Auto-Git Sync (git2)
1. [ ] Add the `git2` crate to the Tauri backend dependencies.
2. [ ] Implement Tauri commands to handle `git pull`, `git add`, `git commit`, and `git push`.
3. [ ] Set up a background watcher or lifecycle hooks:
   - Run `git pull` on application start.
   - Run `git commit` and `git push` on idle or application close.

## Phase 5: UI/UX Polish
1. [ ] Refine the Obsidian-inspired premium UI.
2. [ ] Add Framer Motion animations for page transitions and file interactions.
3. [ ] Optimize performance and responsiveness.
