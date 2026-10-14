use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

const REPO_URL: &str = "git@github.com:oioiovo/blog.git";

fn repo_dir() -> PathBuf {
    let exe = std::env::current_exe().expect("cannot get exe path");
    exe.parent().unwrap().join("blog")
}

#[cfg(not(debug_assertions))]
fn bundled_node(app: &tauri::App) -> PathBuf {
    // In production, external bin is next to the exe
    let exe = std::env::current_exe().expect("cannot get exe path");
    exe.parent().unwrap().join("node.exe")
}

#[cfg(not(debug_assertions))]
fn ensure_repo() -> Result<(), String> {
    let dir = repo_dir();
    if dir.join(".git").exists() {
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
fn start_admin_server(app: &tauri::App) -> Result<(), String> {
    let dir = repo_dir();
    let server = dir.join("admin").join("server.mjs");
    let node = bundled_node(app);
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
                if let Err(e) = start_admin_server(app) {
                    println!("[setup] server error: {}", e);
                }
                std::thread::sleep(std::time::Duration::from_millis(1500));
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.href = 'http://localhost:3001';");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
