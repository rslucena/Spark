# Current Active Task: Phase 4: Auto-Git Sync (Rust / git2)

**Objective:**
Integrate the `git2` Rust crate to manage the "SparkVault" folder as a Git repository. Provide Tauri commands to allow the frontend to commit and push changes, establishing the "Auto-Git Sync" feature.

**Requirements:**
- [ ] Add the `git2` crate to `src-tauri/Cargo.toml`.
- [ ] Write Rust functions (Tauri commands) for:
  - `git_init` or checking if a repo exists.
  - `git_status`: Check for changes.
  - `git_add`: Stage modified files.
  - `git_commit`: Create a timestamped commit.
  - `git_push`: Push changes to remote.
  - `git_pull`: Fetch and merge changes from remote.
- [ ] Ensure the frontend can interact with these commands, creating a seamless sync experience for the user.
- [ ] Handle potential errors (e.g., no remote configured, merge conflicts) gracefully.

**Status:** IN PROGRESS
