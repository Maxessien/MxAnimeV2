use tokio::sync::RwLock;

pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_watch_history,
            commands::save_dl_history,
            commands::get_json_file,
            commands::dl_file
        ])
        .manage(RwLock::new(commands::CancelFlag {
            active: false,
            id: String::new(),
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
