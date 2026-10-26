pub mod commands;


use tauri::plugin::Builder as PluginBuilder;
use crate::commands::CancelFlag;
use tokio::sync::RwLock;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            // Prevent ADS redirects
            PluginBuilder::<_, ()>::new("navigation-interceptor")
                .js_init_script(
                    r#"
                    // Intercept window.open calls
                    window.open = (url) => {
                        return null;
                    };

                    // Intercept target="_blank" clicks
                    document.addEventListener('click', (e) => {
                        const link = e.target.closest('a[target="_blank"]');
                        if (link && link.href) {
                            e.preventDefault();
                        }
                    }, true);
                "#,
                )
                .on_navigation(|_, url| {
                    if url.scheme() == "tauri"
                        || url.host_str() == Some("tauri.localhost")
                        || url.host_str() == Some("localhost")
                    {
                        return true;
                    }
                    false
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::save_watch_history,
            commands::save_dl_history,
            commands::get_json_file,
            commands::dl_file,
            commands::cancel_dl
        ])
        .manage(RwLock::new(CancelFlag {
                    active: false,
                    id: String::new(),
                }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
