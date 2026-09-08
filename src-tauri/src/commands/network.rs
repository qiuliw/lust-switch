use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;

#[tauri::command]
pub fn install_clash(app: AppHandle) -> Result<(), String> {
    let installer = app
        .path()
        .resolve(
            lust_clash_verge::INSTALLER_RESOURCE_PATH,
            BaseDirectory::Resource,
        )
        .map_err(|err| err.to_string())?;

    lust_clash_verge::launch_installer(&installer)
}
