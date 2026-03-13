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
fn git_commit(repo_path: String, message: String, author_name: String, author_email: String, branch: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;
    
    let branch_name = if branch.is_empty() { "main".to_string() } else { branch };
    let refname = format!("refs/heads/{}", branch_name);

    // If it's a new repo or HEAD is unborn, ensure HEAD points to the desired branch
    if repo.head().is_err() {
        repo.set_head(&refname).map_err(|e| format!("Failed to set initial HEAD to {}: {}", branch_name, e))?;
    }

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
            match head.peel_to_commit() {
                Ok(c) => Some(c),
                Err(_) => None,
            }
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
fn git_push(repo_path: String, remote_url: String, pat: String, branch: String) -> Result<String, String> {
    if remote_url.is_empty() {
        return Ok("No remote configured, skipping push.".to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;
    let branch_name = if branch.is_empty() { "main".to_string() } else { branch };
    let refname = format!("refs/heads/{}", branch_name);

    // Check if the local branch actually exists before pushing
    if repo.find_reference(&refname).is_err() {
        return Err(format!("Local branch '{}' not found. Have you made any changes and committed them yet?", branch_name));
    }

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
        Cred::userpass_plaintext("token", &pat)
    });

    let mut push_options = PushOptions::new();
    push_options.remote_callbacks(callbacks);

    let refspec = format!("{}:{}", refname, refname);
    
    match remote.push(&[&refspec], Some(&mut push_options)) {
        Ok(_) => Ok("Push successful".to_string()),
        Err(e) => Err(format!("Failed to push: {} (Make sure the branch name '{}' matches the remote branch)", e, branch_name)),
    }
}

#[tauri::command]
fn git_pull(repo_path: String, remote_url: String, pat: String, branch: String, subfolder: String) -> Result<String, String> {
    if remote_url.is_empty() {
        return Ok("No remote configured, skipping pull.".to_string());
    }

    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;
    
    // Configure sparse checkout if subfolder provided
    if !subfolder.is_empty() {
        let mut config = repo.config().map_err(|e| format!("Failed to open config: {}", e))?;
        config.set_bool("core.sparseCheckout", true).map_err(|e| format!("Failed to enable sparse checkout: {}", e))?;
        
        let clean_path = if subfolder.starts_with("/") { subfolder.clone() } else { format!("/{}", subfolder) };
        let sparse_path = std::path::Path::new(&repo_path).join(".git").join("info").join("sparse-checkout");
        std::fs::create_dir_all(sparse_path.parent().unwrap()).unwrap();
        std::fs::write(sparse_path, format!("{}/*\n", clean_path.trim_end_matches('/'))).map_err(|e| format!("Failed to write sparse-checkout file: {}", e))?;
        
        // After setting sparse-checkout, we need to refresh the working tree
        // In git2, this is done by reading the index and checking out
    }

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
        Cred::userpass_plaintext("token", &pat)
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    let branch_name = if branch.is_empty() { "main".to_string() } else { branch };
    
    remote.fetch(&[&branch_name], Some(&mut fetch_opts), None)
        .map_err(|e| format!("Failed to fetch from remote (check PAT and URL): {}", e))?;

    let fetch_head = repo.find_reference("FETCH_HEAD").map_err(|e| format!("Failed to find FETCH_HEAD: {}", e))?;
    let fetch_commit = repo.reference_to_annotated_commit(&fetch_head).map_err(|e| format!("Failed to resolve FETCH_HEAD: {}", e))?;

    let analysis = repo.merge_analysis(&[&fetch_commit]).map_err(|e| format!("Merge analysis failed: {}", e))?;
    let refname = format!("refs/heads/{}", branch_name);

    if analysis.0.is_unborn() || repo.head().is_err() {
        let commit = repo.find_commit(fetch_commit.id()).map_err(|e| format!("Failed to find fetched commit: {}", e))?;
        if repo.find_reference(&refname).is_err() {
            repo.branch(&branch_name, &commit, false).map_err(|e| format!("Failed to create local branch {}: {}", branch_name, e))?;
        }
        repo.set_head(&refname).map_err(|e| format!("Failed to set HEAD to {}: {}", branch_name, e))?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force())).map_err(|e| format!("Failed to checkout: {}", e))?;
        Ok(format!("Initial pull successful. Checked out '{}'", branch_name))
    } else if analysis.0.is_fast_forward() {
        let mut reference = repo.find_reference(&refname).map_err(|e| format!("Failed to find reference {}: {}", refname, e))?;
        reference.set_target(fetch_commit.id(), "Fast-forward").map_err(|e| format!("Failed to set reference: {}", e))?;
        repo.set_head(&refname).map_err(|e| format!("Failed to set HEAD: {}", e))?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force())).map_err(|e| format!("Failed to checkout: {}", e))?;
        Ok("Pull successful (Fast-forward)".to_string())
    } else if analysis.0.is_up_to_date() {
        Ok("Already up to date".to_string())
    } else {
        Err("Pull failed: Remote has changes that require a manual merge or rebase. (Conflicts detected)".to_string())
    }
}

#[tauri::command]
fn git_hard_reset(repo_path: String, remote_url: String, pat: String, branch: String, subfolder: String) -> Result<String, String> {
    let repo = Repository::open(&repo_path).map_err(|e| format!("Failed to open repository: {}", e))?;
    
    // Ensure sparse checkout is configured if subfolder provided
    if !subfolder.is_empty() {
        let mut config = repo.config().map_err(|e| format!("Failed to open config: {}", e))?;
        config.set_bool("core.sparseCheckout", true).unwrap_or(());
        let clean_path = if subfolder.starts_with("/") { subfolder.clone() } else { format!("/{}", subfolder) };
        let sparse_path = std::path::Path::new(&repo_path).join(".git").join("info").join("sparse-checkout");
        let _ = std::fs::write(sparse_path, format!("{}/*\n", clean_path.trim_end_matches('/')));
    }

    let mut remote = match repo.find_remote("origin") {
        Ok(r) => r,
        Err(_) => repo.remote("origin", &remote_url).map_err(|e| format!("Failed to create remote: {}", e))?
    };

    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
        Cred::userpass_plaintext("token", &pat)
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    let branch_name = if branch.is_empty() { "main".to_string() } else { branch };
    
    // 1. Fetch
    remote.fetch(&[&branch_name], Some(&mut fetch_opts), None)
        .map_err(|e| format!("Fetch failed: {}", e))?;

    // 2. Find remote branch head
    let fetch_head = repo.find_reference("FETCH_HEAD").map_err(|e| format!("FETCH_HEAD not found: {}", e))?;
    let fetch_commit = repo.find_commit(fetch_head.target().unwrap()).map_err(|e| format!("Failed to find commit: {}", e))?;

    // 3. Hard Reset
    let mut checkout_opts = git2::build::CheckoutBuilder::new();
    checkout_opts.force();
    
    repo.reset(fetch_commit.as_object(), git2::ResetType::Hard, Some(&mut checkout_opts))
        .map_err(|e| format!("Hard reset failed: {}", e))?;

    // 4. Ensure local branch exists and points to this commit
    let refname = format!("refs/heads/{}", branch_name);
    if let Ok(mut branch_ref) = repo.find_reference(&refname) {
        branch_ref.set_target(fetch_commit.id(), "Manual force sync").map_err(|e| format!("Failed to update local branch ref: {}", e))?;
    } else {
        repo.branch(&branch_name, &fetch_commit, false).map_err(|e| format!("Failed to create local branch: {}", e))?;
    }
    
    repo.set_head(&refname).map_err(|e| format!("Failed to set HEAD: {}", e))?;

    Ok("Force sync successful. Local changes discarded and state updated to match GitHub.".to_string())
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
            git_push,
            git_pull,
            git_hard_reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
