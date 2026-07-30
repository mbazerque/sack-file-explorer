mod search;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;
use tauri::{AppHandle, Emitter, Manager};

use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};

pub struct TerminalSession {
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
}

pub struct TerminalManager {
    pub sessions: Arc<Mutex<HashMap<String, TerminalSession>>>,
}

impl Default for TerminalManager {
    fn default() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileItem {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DriveItem {
    pub name: String,
    pub path: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
}

#[tauri::command]
fn get_system_drives() -> Result<Vec<DriveItem>, String> {
    let mut drives = Vec::new();
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;

        extern "system" {
            fn GetDiskFreeSpaceExW(
                lpDirectoryName: *const u16,
                lpFreeBytesAvailableToCaller: *mut u64,
                lpTotalNumberOfBytes: *mut u64,
                lpTotalNumberOfFreeBytes: *mut u64,
            ) -> i32;
        }

        for c in b'A'..=b'Z' {
            let drive_letter = format!("{}:\\", c as char);
            let path_obj = Path::new(&drive_letter);
            if path_obj.exists() {
                let wide: Vec<u16> = OsStr::new(&drive_letter)
                    .encode_wide()
                    .chain(std::iter::once(0))
                    .collect();

                let mut user_free_bytes: u64 = 0;
                let mut total_bytes: u64 = 0;
                let mut total_free_bytes: u64 = 0;

                let (total, available) = unsafe {
                    if GetDiskFreeSpaceExW(
                        wide.as_ptr(),
                        &mut user_free_bytes,
                        &mut total_bytes,
                        &mut total_free_bytes,
                    ) != 0
                    {
                        (total_bytes, user_free_bytes)
                    } else {
                        (0, 0)
                    }
                };

                drives.push(DriveItem {
                    name: format!("Disco ({}:)", c as char),
                    path: format!("{}:/", c as char),
                    total_bytes: total,
                    available_bytes: available,
                });
            }
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        drives.push(DriveItem {
            name: "Raíz (/)".into(),
            path: "/".into(),
            total_bytes: 0,
            available_bytes: 0,
        });
    }
    Ok(drives)
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
fn open_file_default(path: String) -> Result<(), String> {
    let norm_path = path.replace("/", "\\");
    let p = Path::new(&norm_path);
    if !p.exists() {
        return Err(format!("El archivo no existe: {}", norm_path));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &norm_path])
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&norm_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&norm_path)
            .spawn()
            .map_err(|e| format!("Failed to open file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn open_in_vscode(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "code", &path])
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}", e))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("code")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open VS Code: {}", e))?;
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
fn rename_item(old_path: String, new_path: String) -> Result<(), String> {
    let old_p = Path::new(&old_path);
    let new_p = Path::new(&new_path);
    fs::rename(old_p, new_p).map_err(|e| format!("Failed to rename item: {}", e))
}

#[tauri::command]
fn trash_item(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;

        #[repr(C, packed(2))]
        struct SHFILEOPSTRUCTW {
            hwnd: *mut std::ffi::c_void,
            w_func: u32,
            p_from: *const u16,
            p_to: *const u16,
            f_flags: u16,
            f_any_operations_aborted: i32,
            h_name_mappings: *mut std::ffi::c_void,
            lpsz_progress_title: *const u16,
        }

        const FO_DELETE: u32 = 0x0003;
        const FOF_ALLOWUNDO: u16 = 0x0040;
        const FOF_NOCONFIRMATION: u16 = 0x0010;
        const FOF_SILENT: u16 = 0x0004;

        extern "system" {
            fn SHFileOperationW(lpFileOp: *mut SHFILEOPSTRUCTW) -> i32;
        }

        let mut wide: Vec<u16> = OsStr::new(&path)
            .encode_wide()
            .chain(std::iter::once(0))
            .chain(std::iter::once(0))
            .collect();

        let mut file_op = SHFILEOPSTRUCTW {
            hwnd: std::ptr::null_mut(),
            w_func: FO_DELETE,
            p_from: wide.as_mut_ptr(),
            p_to: std::ptr::null(),
            f_flags: FOF_ALLOWUNDO | FOF_NOCONFIRMATION | FOF_SILENT,
            f_any_operations_aborted: 0,
            h_name_mappings: std::ptr::null_mut(),
            lpsz_progress_title: std::ptr::null(),
        };

        let res = unsafe { SHFileOperationW(&mut file_op) };
        if res != 0 || file_op.f_any_operations_aborted != 0 {
            delete_item(path)?;
        }
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        delete_item(path)
    }
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

#[tauri::command]
fn create_terminal_session(
    app: AppHandle,
    state: tauri::State<'_, TerminalManager>,
    session_id: String,
    cwd: String,
    cols: Option<u16>,
    rows: Option<u16>,
) -> Result<(), String> {
    // Kill existing session with the same session_id to avoid duplicate processes
    {
        let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
        // Dropping the old session closes the master PTY and kills the child
        sessions.remove(&session_id);
    }

    let pty_system = native_pty_system();

    let pty_size = PtySize {
        rows: rows.unwrap_or(24),
        cols: cols.unwrap_or(80),
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system
        .openpty(pty_size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let mut cmd = if cfg!(target_os = "windows") {
        let mut c = CommandBuilder::new("powershell.exe");
        c.args(["-NoLogo"]);
        c
    } else {
        CommandBuilder::new("/bin/bash")
    };

    let target_cwd = if cwd.trim().is_empty() {
        "C:\\".to_string()
    } else {
        cwd
    };

    if std::path::Path::new(&target_cwd).exists() {
        cmd.cwd(&target_cwd);
    }

    let _child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    // We intentionally drop the slave side — the master is enough for I/O
    drop(pair.slave);

    let mut reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to clone PTY reader: {}", e))?;

    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to take PTY writer: {}", e))?;

    {
        let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
        sessions.insert(
            session_id.clone(),
            TerminalSession {
                master: pair.master,
                writer,
            },
        );
    }

    // Spawn a thread that reads PTY output and emits it to the frontend
    let app_handle = app;
    let id = session_id;
    std::thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let _ = app_handle.emit(&format!("terminal-output-{}", id), text);
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn write_terminal_data(
    state: tauri::State<'_, TerminalManager>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.get_mut(&session_id) {
        session
            .writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn resize_terminal(
    state: tauri::State<'_, TerminalManager>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.get(&session_id) {
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to resize PTY: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn close_terminal_session(
    state: tauri::State<'_, TerminalManager>,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    // Dropping the TerminalSession closes master PTY which signals EOF to child
    sessions.remove(&session_id);
    Ok(())
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<String, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let settings_path = app_data.join("settings.json");
    if settings_path.exists() {
        fs::read_to_string(&settings_path).map_err(|e| format!("Failed to read settings: {}", e))
    } else {
        Ok("{}".into())
    }
}

#[tauri::command]
fn save_settings(app: AppHandle, json_content: String) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_data).map_err(|e| format!("Failed to create app_data_dir: {}", e))?;
    let settings_path = app_data.join("settings.json");
    fs::write(&settings_path, json_content).map_err(|e| format!("Failed to write settings: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TerminalManager::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            open_in_terminal,
            open_in_vscode,
            delete_item,
            copy_item,
            move_item,
            rename_item,
            trash_item,
            search::search_files,
            read_file_content,
            get_system_drives,
            create_terminal_session,
            write_terminal_data,
            resize_terminal,
            close_terminal_session,
            load_settings,
            save_settings,
            open_file_default,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

