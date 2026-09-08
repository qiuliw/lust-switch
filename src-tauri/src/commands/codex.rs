#[tauri::command]
pub fn apply_codex_relay(api_key: String) -> Result<(), String> {
    lust_codex::apply_relay(&api_key)
}

#[tauri::command]
pub fn exit_codex_relay() -> Result<(), String> {
    lust_codex::exit_relay()
}
