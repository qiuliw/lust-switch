use std::path::Path;
use std::process::Command;

/// Bundled Clash Verge installer filename (Windows x64).
pub const INSTALLER_FILENAME: &str = "Clash.Verge_2.5.2_x64-setup.exe";

/// Relative path under Tauri's resource directory.
pub const INSTALLER_RESOURCE_PATH: &str = "resources/Clash.Verge_2.5.2_x64-setup.exe";

/// Launch the Clash Verge installer at `path`.
pub fn launch_installer(path: &Path) -> Result<(), String> {
    if !path.is_file() {
        return Err(format!("Clash installer not found at {}", path.display()));
    }

    Command::new(path)
        .spawn()
        .map_err(|err| format!("Failed to launch Clash installer: {err}"))?;

    Ok(())
}
