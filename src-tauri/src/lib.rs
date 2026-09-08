// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn install_clash(app: AppHandle) -> Result<(), String> {
    let installer = app
        .path()
        .resolve(
            lust_clash_verge::INSTALLER_RESOURCE_PATH,
            BaseDirectory::Resource,
        )
        .map_err(|err| err.to_string())?;

    lust_clash_verge::launch_installer(&installer)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, install_clash])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
