mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::network::install_clash,
            commands::codex::apply_codex_relay,
            commands::codex::exit_codex_relay,
            commands::clipboard::copy_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
