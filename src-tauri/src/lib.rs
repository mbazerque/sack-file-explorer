// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn scan_directory(path: String) -> Vec<String> {
    vec![
        format!("{}/dummy_file_1.txt", path),
        format!("{}/dummy_file_2.png", path),
        format!("{}/dummy_folder", path),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
