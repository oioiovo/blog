use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

const REPO_URL: &str = "git@github.com:oioiovo/blog.git";

fn exe_dir() -> PathBuf {
    std::env::current_exe().unwrap().parent().unwrap().to_path_buf()
}

fn repo_dir() -> PathBuf {
    exe_dir().join("blog")
}

#[cfg(not(debug_assertions))]
fn bundled_node() -> PathBuf {
    exe_dir().join("node.exe")
}

#[cfg(not(debug_assertions))]
fn ensure_repo() -> Result<(), String> {
    let dir = repo_dir();
    if dir.join(".git").exists() {
        // pull latest
        let _ = Command::new("git")
            .arg("pull")
            .current_dir(&dir)
            .output();
        return Ok(());
    }
    println!("[setup] cloning repo to {:?}", dir);
    let output = Command::new("git")
        .arg("clone")
        .arg(REPO_URL)
        .arg(&dir)
        .output()
        .map_err(|e| format!("failed to run git: {}", e))?;
    if !output.status.success() {
        return Err(format!(
            "git clone failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    Ok(())
}

#[cfg(not(debug_assertions))]
fn start_admin_server() -> Result<(), String> {
    let dir = repo_dir();
    let server = dir.join("admin").join("server.mjs");
    let node = bundled_node();
    println!("[setup] starting admin server: {} via {:?}", server.display(), node);
    Command::new(&node)
        .arg(&server)
        .current_dir(&dir)
        .spawn()
        .map_err(|e| format!("failed to start node: {}", e))?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                if let Err(e) = ensure_repo() {
                    println!("[setup] repo error: {}", e);
                }
                if let Err(e) = start_admin_server() {
                    println!("[setup] server error: {}", e);
                }
                std::thread::sleep(std::time::Duration::from_millis(2000));
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.href = 'http://localhost:3001';");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
