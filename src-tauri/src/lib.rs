mod search;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileItem {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: Option<u64>,
}

#[tauri::command]
fn scan_directory(path: String) -> Result<Vec<FileItem>, String> {
    let mut files = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        if let Ok(entry) = entry {
            let file_name = entry.file_name().to_string_lossy().into_owned();
            let metadata = entry.metadata();
            
            let (is_dir, size, modified_at) = match metadata {
                Ok(meta) => {
                    let is_dir = meta.is_dir();
                    let size = meta.len();
                    let modified_at = meta.modified().ok().and_then(|t| {
                        t.duration_since(UNIX_EPOCH).ok().map(|d| d.as_millis() as u64)
                    });
                    (is_dir, size, modified_at)
                }
                Err(_) => (false, 0, None),
            };

            files.push(FileItem {
                name: file_name,
                is_dir,
                size,
                modified_at,
            });
        }
    }

    files.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(files)
}

#[tauri::command]
fn open_in_terminal(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "powershell", "-NoExit", "-Command", &format!("Set-Location -LiteralPath '{}'", path)])
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("x-terminal-emulator")
            .arg(&format!("--working-directory={}", path))
            .spawn()
            .map_err(|e| format!("Failed to open terminal: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn delete_item(path: String) -> Result<(), String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to read metadata: {}", e))?;
    if metadata.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    Ok(())
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let file_type = entry.file_type()?;
        let target_path = dst.join(entry.file_name());
        if file_type.is_dir() {
            copy_dir_recursive(&entry.path(), &target_path)?;
        } else {
            fs::copy(entry.path(), target_path)?;
        }
    }
    Ok(())
}

#[tauri::command]
fn copy_item(src: String, dst_dir: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let file_name = src_path.file_name().ok_or("Invalid source filename")?;
    let target = Path::new(&dst_dir).join(file_name);

    if src_path.is_dir() {
        copy_dir_recursive(src_path, &target).map_err(|e| format!("Failed to copy directory: {}", e))?;
    } else {
        fs::copy(src_path, target).map_err(|e| format!("Failed to copy file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn move_item(src: String, dst_dir: String) -> Result<(), String> {
    let src_path = Path::new(&src);
    let file_name = src_path.file_name().ok_or("Invalid source filename")?;
    let target = Path::new(&dst_dir).join(file_name);

    if fs::rename(src_path, &target).is_err() {
        if src_path.is_dir() {
            copy_dir_recursive(src_path, &target).map_err(|e| format!("Failed to move directory: {}", e))?;
            fs::remove_dir_all(src_path).map_err(|e| format!("Failed to delete original directory: {}", e))?;
        } else {
            fs::copy(src_path, &target).map_err(|e| format!("Failed to move file: {}", e))?;
            fs::remove_file(src_path).map_err(|e| format!("Failed to delete original file: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to read metadata: {}", e))?;
    if metadata.is_dir() {
        return Err("Cannot read content of a directory".into());
    }
    if metadata.len() > 2 * 1024 * 1024 {
        let file = fs::File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;
        use std::io::Read;
        let mut handle = file.take(2 * 1024 * 1024);
        let mut buffer = Vec::new();
        handle.read_to_end(&mut buffer).map_err(|e| format!("Failed to read file: {}", e))?;
        let text = String::from_utf8_lossy(&buffer).to_string();
        return Ok(format!("{}\n\n--- [Contenido truncado por superar 2MB] ---", text));
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file as text: {}", e))?;
    Ok(content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            open_in_terminal,
            delete_item,
            copy_item,
            move_item,
            search::search_files,
            read_file_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
