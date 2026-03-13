use git2::{Repository, Signature};
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
fn git_commit(repo_path: String, message: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;

    // Stage all changes
    let mut index = repo.index().map_err(|e| format!("Failed to get index: {}", e))?;
    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| format!("Failed to add files to index: {}", e))?;
    index.write().map_err(|e| format!("Failed to write index: {}", e))?;

    let tree_id = index.write_tree().map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo.find_tree(tree_id).map_err(|e| format!("Failed to find tree: {}", e))?;

    // Use a default signature for now (in a real app, this should come from config)
    let sig = Signature::now("Spark User", "user@spark.local").map_err(|e| format!("Failed to create signature: {}", e))?;

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
            git_commit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
