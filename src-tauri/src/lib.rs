use git2::{Repository, Signature, Cred, RemoteCallbacks, FetchOptions, PushOptions};
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn git_init(repo_path: String) -> Result<String, String> {
    let path = Path::new(&repo_path);

    // Check if repo already exists
    if path.join(".git").exists() {
        return Ok("Repository already initialized".to_string());
    }

    match Repository::init(path) {
        Ok(_) => Ok("Repository initialized successfully".to_string()),
        Err(e) => Err(format!("Failed to initialize repository: {}", e)),
    }
}

#[tauri::command]
fn git_status(repo_path: String) -> Result<String, String> {
    let repo = Repository::open(repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;

    let mut opts = git2::StatusOptions::new();
    opts.include_untracked(true);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| format!("Failed to get status: {}", e))?;

    let mut changed_files = Vec::new();
    for entry in statuses.iter() {
        if let Some(path) = entry.path() {
            changed_files.push(path.to_string());
        }
    }

    if changed_files.is_empty() {
        Ok("Working tree clean".to_string())
    } else {
        Ok(format!("Changes found in: {:?}", changed_files))
    }
}

#[tauri::command]
fn git_commit(repo_path: String, message: String, author_name: String, author_email: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;

    // Stage all changes
    let mut index = repo.index().map_err(|e| format!("Failed to get index: {}", e))?;
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| format!("Failed to add files to index: {}", e))?;
    index.write().map_err(|e| format!("Failed to write index: {}", e))?;

    let tree_id = index.write_tree().map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id).map_err(|e| format!("Failed to find tree: {}", e))?;

    let sig = Signature::now(&author_name, &author_email).map_err(|e| format!("Failed to create signature: {}", e))?;

    // Determine the parent commit
    let parent_commit = match repo.head() {
        Ok(head) => {
            let target = head.target().unwrap();
            Some(repo.find_commit(target).unwrap())
        },
        Err(_) => None, // Initial commit
    };

    let parents = if let Some(parent) = &parent_commit {
        vec![parent]
    } else {
        vec![]
    };

    repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &message,
        &tree,
        &parents,
    ).map_err(|e| format!("Failed to commit: {}", e))?;

    Ok("Commit successful".to_string())
}

#[tauri::command]
fn git_push(repo_path: String, remote_url: String, pat: String) -> Result<String, String> {
    if remote_url.is_empty() {
        return Ok("No remote configured, skipping push.".to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;

    // Set up or get the remote
    let mut remote = match repo.find_remote("origin") {
        Ok(r) => {
            if r.url() != Some(&remote_url) {
                repo.remote_set_url("origin", &remote_url).map_err(|e| format!("Failed to set remote url: {}", e))?;
                repo.find_remote("origin").map_err(|e| format!("Failed to find remote after setting url: {}", e))?
            } else {
                r
            }
        },
        Err(_) => {
            repo.remote("origin", &remote_url).map_err(|e| format!("Failed to create remote: {}", e))?
        }
    };

    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
        // Use PAT as a token
        Cred::userpass_plaintext("token", &pat)
    });

    let mut push_options = PushOptions::new();
    push_options.remote_callbacks(callbacks);

    // Push HEAD to main/master (using refs/heads/main as default)
    let refspec = "refs/heads/main:refs/heads/main";
    match remote.push(&[refspec], Some(&mut push_options)) {
        Ok(_) => Ok("Push successful".to_string()),
        Err(e) => Err(format!("Failed to push: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            git_init,
            git_status,
            git_commit,
            git_push
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
