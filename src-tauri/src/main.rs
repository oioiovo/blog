use std::net::SocketAddr;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

use axum::{
    extract::{DefaultBodyLimit, Multipart, Path as AxumPath},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::services::ServeDir;

// ---------- paths ----------

fn exe_dir() -> PathBuf {
    std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

#[cfg(not(debug_assertions))]
fn repo_dir() -> PathBuf {
    exe_dir().join("blog")
}

#[cfg(debug_assertions)]
fn repo_dir() -> PathBuf {
    // dev mode: use project root
    let mut p = std::env::current_dir().unwrap();
    while !p.join("content").exists() {
        p = p.parent().unwrap().to_path_buf();
    }
    p
}

fn posts_dir() -> PathBuf {
    repo_dir().join("content").join("posts")
}

fn readme_path() -> PathBuf {
    repo_dir().join("content").join("README.md")
}

fn config_path(name: &str) -> PathBuf {
    repo_dir().join("config").join(name)
}

fn images_dir() -> PathBuf {
    repo_dir().join("public").join("images")
}

// ---------- frontmatter ----------

fn split_frontmatter(raw: &str) -> (serde_json::Value, &str) {
    let trimmed = raw.trim_start();
    if !trimmed.starts_with("---") {
        return (serde_json::Value::Null, raw);
    }
    let rest = &trimmed[3..];
    if let Some(end) = rest.find("\n---") {
        let fm_str = &rest[..end];
        let body = rest[end + 4..].trim_start_matches('\n');
        let mut map = serde_json::Map::new();
        for line in fm_str.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Some(eq) = line.find(':') {
                let k = line[..eq].trim().to_string();
                let v = line[eq + 1..].trim().trim_matches('"').to_string();
                map.insert(k, serde_json::Value::String(v));
            }
        }
        (serde_json::Value::Object(map), body)
    } else {
        (serde_json::Value::Null, raw)
    }
}

fn build_frontmatter(fm: &serde_json::Value, body: &str) -> String {
    let Some(obj) = fm.as_object() else {
        return body.to_string();
    };
    let mut s = String::from("---\n");
    for (k, v) in obj {
        if let Some(v) = v.as_str() {
            s.push_str(&format!("{}: {}\n", k, v));
        }
    }
    s.push_str("---\n\n");
    s.push_str(body);
    s
}

// ---------- types ----------

#[derive(Debug, Serialize, Deserialize)]
struct TreeNode {
    name: String,
    #[serde(rename = "type")]
    kind: String, // "dir" | "post"
    path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    slug: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    children: Option<Vec<TreeNode>>,
}

#[derive(Debug, Deserialize)]
struct SavePost {
    #[serde(default)]
    title: String,
    #[serde(default)]
    slug: String,
    #[serde(default)]
    summary: String,
    #[serde(default)]
    date: String,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    dir: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct MkDir {
    parent: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct RmPath {
    path: String,
}

// ---------- tree ----------

fn build_tree(dir: &Path) -> Vec<TreeNode> {
    let mut entries: Vec<_> = std::fs::read_dir(dir)
        .into_iter()
        .flatten()
        .flatten()
        .filter(|e| !e.file_name().to_string_lossy().starts_with('.'))
        .collect();
    entries.sort_by_key(|e| {
        let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
        (!is_dir, e.file_name().to_string_lossy().to_lowercase())
    });

    let mut nodes = Vec::new();
    for entry in entries {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let rel = path.strip_prefix(posts_dir()).unwrap().to_path_buf();
        let rel_str = rel.to_string_lossy().replace('\\', "/");
        if path.is_dir() {
            nodes.push(TreeNode {
                name,
                kind: "dir".into(),
                path: rel_str,
                title: None,
                slug: None,
                date: None,
                children: Some(build_tree(&path)),
            });
        } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
            let raw = std::fs::read_to_string(&path).unwrap_or_default();
            let (fm, _) = split_frontmatter(&raw);
            let title = fm.get("title").and_then(|v| v.as_str()).map(String::from);
            let slug = fm.get("slug").and_then(|v| v.as_str()).map(String::from);
            let date = fm.get("date").and_then(|v| v.as_str()).map(String::from);
            nodes.push(TreeNode {
                name: name.trim_end_matches(".md").to_string(),
                kind: "post".into(),
                path: rel_str.trim_end_matches(".md").to_string(),
                title,
                slug,
                date,
                children: None,
            });
        }
    }
    nodes
}

// ---------- git ----------

const TRACKED: &[&str] = &[
    "content/posts/",
    "content/README.md",
    "config/",
    "lib/",
    "app/",
    "components/",
    "public/images/",
];

fn git(args: &[&str]) -> Result<String, String> {
    let out = Command::new("git")
        .current_dir(repo_dir())
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn tracked_status() -> Vec<String> {
    let all = git(&["status", "--porcelain"]).unwrap_or_default();
    all.lines()
        .filter_map(|l| {
            let p = l.get(3..).unwrap_or("").trim().trim_matches('"');
            if TRACKED.iter().any(|t| p.starts_with(t)) {
                Some(l.to_string())
            } else {
                None
            }
        })
        .collect()
}

// ---------- handlers ----------

async fn list_posts() -> Json<Vec<TreeNode>> {
    Json(build_tree(&posts_dir()))
}

async fn read_post(AxumPath(path): AxumPath<String>) -> impl IntoResponse {
    let fp = posts_dir().join(&format!("{}.md", path));
    match std::fs::read_to_string(&fp) {
        Ok(raw) => {
            let (fm, body) = split_frontmatter(&raw);
            Json(serde_json::json!({ "frontmatter": fm, "content": body })).into_response()
        }
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

async fn save_post(AxumPath(path): AxumPath<String>, Json(body): Json<SavePost>) -> impl IntoResponse {
    let dir = posts_dir().join(&path);
    if let Some(parent) = dir.parent() {
        std::fs::create_dir_all(parent).unwrap();
    }
    let fp = posts_dir().join(&format!("{}.md", path));
    let mut fm = serde_json::Map::new();
    fm.insert("title".into(), serde_json::Value::String(body.title));
    if !body.slug.is_empty() {
        fm.insert("slug".into(), serde_json::Value::String(body.slug));
    }
    if !body.summary.is_empty() {
        fm.insert("summary".into(), serde_json::Value::String(body.summary));
    }
    if !body.date.is_empty() {
        fm.insert("date".into(), serde_json::Value::String(body.date));
    }
    fm.insert(
        "tags".into(),
        serde_json::Value::Array(
            body.tags.into_iter().map(serde_json::Value::String).collect(),
        ),
    );
    if !body.dir.is_empty() {
        fm.insert("dir".into(), serde_json::Value::String(body.dir));
    }
    let out = build_frontmatter(&serde_json::Value::Object(fm), &body.content);
    std::fs::write(&fp, out).unwrap();
    Json(serde_json::json!({ "ok": true }))
}

async fn delete_post(AxumPath(path): AxumPath<String>) -> impl IntoResponse {
    let fp = posts_dir().join(&format!("{}.md", path));
    if fp.exists() {
        std::fs::remove_file(&fp).unwrap();
    }
    Json(serde_json::json!({ "ok": true }))
}

async fn mkdir(Json(b): Json<MkDir>) -> impl IntoResponse {
    let p = if b.parent.is_empty() {
        posts_dir().join(&b.name)
    } else {
        posts_dir().join(&b.parent).join(&b.name)
    };
    std::fs::create_dir_all(&p).unwrap();
    Json(serde_json::json!({ "ok": true }))
}

async fn rm_path(Json(b): Json<RmPath>) -> impl IntoResponse {
    let p = posts_dir().join(&b.path);
    if p.is_dir() {
        let _ = std::fs::remove_dir_all(&p);
    } else if p.exists() {
        let _ = std::fs::remove_file(&p);
    }
    Json(serde_json::json!({ "ok": true }))
}

async fn read_readme() -> impl IntoResponse {
    match std::fs::read_to_string(readme_path()) {
        Ok(s) => Json(serde_json::json!({ "content": s })).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

async fn write_readme(Json(b): Json<serde_json::Value>) -> impl IntoResponse {
    let s = b.get("content").and_then(|v| v.as_str()).unwrap_or("");
    std::fs::write(readme_path(), s).unwrap();
    Json(serde_json::json!({ "ok": true }))
}

async fn list_images() -> impl IntoResponse {
    let mut out = Vec::new();
    if let Ok(rd) = std::fs::read_dir(images_dir()) {
        for e in rd.flatten() {
            let n = e.file_name().to_string_lossy().to_string();
            if n.ends_with(".png") || n.ends_with(".jpg") || n.ends_with(".jpeg") || n.ends_with(".gif") || n.ends_with(".webp") || n.ends_with(".svg") {
                out.push(serde_json::json!({ "name": n, "url": format!("/blog/images/{}", n) }));
            }
        }
    }
    Json(out)
}

async fn upload_image(mut mp: Multipart) -> axum::response::Response {
    if let Ok(Some(field)) = mp.next_field().await {
        let name = field.file_name().unwrap_or("upload.png").to_string();
        let name = name.replace(|c: char| !c.is_alphanumeric() && c != '.' && c != '-' && c != '_', "");
        let data = field.bytes().await.unwrap_or_default();
        std::fs::create_dir_all(images_dir()).unwrap();
        let fp = images_dir().join(&name);
        std::fs::write(&fp, &data).unwrap();
        Json(serde_json::json!({ "ok": true, "url": format!("/blog/images/{}", name) })).into_response()
    } else {
        (StatusCode::BAD_REQUEST, "no file").into_response()
    }
}

async fn delete_image(AxumPath(name): AxumPath<String>) -> impl IntoResponse {
    let fp = images_dir().join(&name);
    if fp.exists() {
        let _ = std::fs::remove_file(&fp);
    }
    Json(serde_json::json!({ "ok": true }))
}

async fn git_status() -> impl IntoResponse {
    let c = tracked_status();
    Json(serde_json::json!({ "dirty": !c.is_empty(), "changed": c.len() }))
}

async fn publish() -> axum::response::Response {
    let c = tracked_status();
    if c.is_empty() {
        return Json(serde_json::json!({ "ok": true, "message": "no changes" })).into_response();
    }
    for p in TRACKED {
        let _ = git(&["add", p]);
    }
    let stamp = chrono_like_now();
    let _ = git(&["commit", "-m", &format!("chore: publish {} files at {}", c.len(), stamp)]);
    match git(&["push", "origin", "main"]) {
        Ok(_) => Json(serde_json::json!({ "ok": true, "message": format!("published {} files", c.len()) })).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

fn chrono_like_now() -> String {
    // simple local timestamp without chrono dep
    let out = std::process::Command::new("date")
        .arg("+%Y/%m/%d %H:%M:%S")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();
    out.trim().to_string()
}

// ---------- setup / clone ----------

#[cfg(not(debug_assertions))]
fn ensure_repo() -> Result<(), String> {
    let dir = repo_dir();
    if dir.join(".git").exists() {
        let _ = git(&["pull"]);
        return Ok(());
    }
    let out = Command::new("git")
        .args(["clone", "git@github.com:oioiovo/blog.git"])
        .arg(&dir)
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).to_string());
    }
    Ok(())
}

// ---------- app ----------

async fn read_site() -> impl IntoResponse { read_config_file("site").await }
async fn write_site(Json(v): Json<serde_json::Value>) -> impl IntoResponse { write_config_file("site", v).await }
async fn read_projects() -> impl IntoResponse { read_config_file("projects").await }
async fn write_projects(Json(v): Json<serde_json::Value>) -> impl IntoResponse { write_config_file("projects", v).await }
async fn read_about_json() -> impl IntoResponse { read_config_file("about").await }
async fn write_about_json(Json(v): Json<serde_json::Value>) -> impl IntoResponse { write_config_file("about", v).await }

async fn read_config_file(name: &str) -> impl IntoResponse {
    let p = config_path(&format!("{}.json", name));
    match std::fs::read_to_string(&p) {
        Ok(s) => match serde_json::from_str::<serde_json::Value>(&s) {
            Ok(v) => Json(v).into_response(),
            Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
        },
        Err(e) => (StatusCode::NOT_FOUND, e.to_string()).into_response(),
    }
}

async fn write_config_file(name: &str, v: serde_json::Value) -> impl IntoResponse {
    let p = config_path(&format!("{}.json", name));
    std::fs::write(&p, serde_json::to_string_pretty(&v).unwrap() + "\n").unwrap();
    Json(serde_json::json!({ "ok": true }))
}

#[derive(Debug, Deserialize)]
struct NewPost {
    #[serde(default)] title: String,
    #[serde(default)] slug: String,
    #[serde(default)] summary: String,
    #[serde(default)] date: String,
    #[serde(default)] tags: Vec<String>,
    #[serde(default)] dir: String,
    content: String,
}

async fn create_post(Json(b): Json<NewPost>) -> impl IntoResponse {
    let filename = if !b.slug.is_empty() { b.slug.clone() } else { format!("post-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()) };
    let dir = if b.dir.is_empty() { posts_dir() } else { posts_dir().join(&b.dir) };
    std::fs::create_dir_all(&dir).unwrap();
    let fp = dir.join(format!("{}.md", filename));
    let mut fm = serde_json::Map::new();
    fm.insert("title".into(), serde_json::Value::String(if b.title.is_empty() { filename.clone() } else { b.title.clone() }));
    if !b.summary.is_empty() { fm.insert("summary".into(), serde_json::Value::String(b.summary.clone())); }
    if !b.date.is_empty() { fm.insert("date".into(), serde_json::Value::String(b.date.clone())); }
    fm.insert("tags".into(), serde_json::Value::Array(b.tags.iter().map(|t| serde_json::Value::String(t.clone())).collect()));
    if !b.dir.is_empty() { fm.insert("dir".into(), serde_json::Value::String(b.dir.clone())); }
    let out = build_frontmatter(&serde_json::Value::Object(fm), &b.content);
    std::fs::write(&fp, out).unwrap();
    Json(serde_json::json!({ "ok": true, "path": format!("{}/{}", b.dir, filename) }))
}

#[derive(Debug, Deserialize)]
struct RenameDir {
    oldPath: String,
    newPath: String,
}

async fn rename_dir(Json(b): Json<RenameDir>) -> impl IntoResponse {
    let from = posts_dir().join(&b.oldPath);
    let to = posts_dir().join(&b.newPath);
    if from.exists() {
        if let Some(parent) = to.parent() { std::fs::create_dir_all(parent).unwrap(); }
        let _ = std::fs::rename(&from, &to);
    }
    Json(serde_json::json!({ "ok": true }))
}

fn build_router() -> Router {
    let admin_static = repo_dir().join("admin").join("public");
    let images = images_dir();

    Router::new()
        .route("/api/posts", get(list_posts).post(create_post))
        .route("/api/posts/*path", get(read_post).put(save_post).delete(delete_post))
        .route("/api/dirs", put(mkdir).post(mkdir).delete(rm_path))
        .route("/api/dirs/rename", post(rename_dir))
        .route("/api/site", get(read_site).put(write_site))
        .route("/api/projects", get(read_projects).put(write_projects))
        .route("/api/about-json", get(read_about_json).put(write_about_json))
        .route("/api/readme", get(read_readme).put(write_readme))
        .route("/api/images", get(list_images).post(upload_image))
        .route("/api/images/:name", delete(delete_image))
        .route("/api/git-status", get(git_status))
        .route("/api/publish", post(publish).put(publish))
        .nest_service("/images", ServeDir::new(&images))
        .nest_service("/blog/images", ServeDir::new(&images))
        .nest_service("/", ServeDir::new(&admin_static))
        .layer(DefaultBodyLimit::max(20 * 1024 * 1024))
}

#[tokio::main]
async fn main() {
    #[cfg(not(debug_assertions))]
    {
        if let Err(e) = ensure_repo() {
            eprintln!("[setup] repo error: {}", e);
        }
    }

    let app = build_router();
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    println!("[admin] listening on http://{}", addr);

    // spawn server in background, then start Tauri
    tokio::spawn(async move {
        axum::serve(
            tokio::net::TcpListener::bind(addr).await.unwrap(),
            app,
        )
        .await
        .unwrap();
    });

    // wait a moment for server to start
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;

    tauri::Builder::default()
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.eval("window.location.href = 'http://localhost:3001';");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("tauri error");
}

// ---------- tests ----------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_frontmatter_basic() {
        let raw = "---\ntitle: Hello\nslug: hello-world\n---\n\nbody here";
        let (fm, body) = split_frontmatter(raw);
        assert_eq!(fm["title"], "Hello");
        assert_eq!(fm["slug"], "hello-world");
        assert_eq!(body.trim(), "body here");
    }

    #[test]
    fn split_frontmatter_no_fm() {
        let raw = "just body";
        let (fm, body) = split_frontmatter(raw);
        assert_eq!(fm, serde_json::Value::Null);
        assert_eq!(body, "just body");
    }

    #[test]
    fn build_frontmatter_roundtrip() {
        let fm = serde_json::json!({
            "title": "Test Post",
            "slug": "test-post",
            "date": "2026-10-14"
        });
        let s = build_frontmatter(&fm, "hello world");
        assert!(s.starts_with("---\n"));
        assert!(s.contains("title: Test Post"));
        assert!(s.contains("slug: test-post"));
        assert!(s.ends_with("hello world"));
    }

    #[test]
    fn tracked_status_filters() {
        // just verify TRACKED prefix logic
        let line = " D \"content/posts/Android/占位2.md\"";
        let p = line.get(3..).unwrap().trim().trim_matches('"');
        assert!(TRACKED.iter().any(|t| p.starts_with(t)));
    }

    #[test]
    fn tree_builds_empty() {
        // if posts dir exists, should not panic
        let _ = build_tree(&posts_dir());
    }
}
