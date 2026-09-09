use std::fs;
use std::path::{Path, PathBuf};

use serde_json::{Map, Value};
use toml_edit::{DocumentMut, Item, Table, value};

pub const RELAY_MODEL: &str = "gpt-5.6-sol";
pub const RELAY_PROVIDER_ID: &str = "newaigpt";
pub const RELAY_PROVIDER_NAME: &str = "AIGPT";
pub const RELAY_BASE_URL: &str = "https://api.admincloudai.com/v1";
pub const RELAY_WIRE_API: &str = "responses";

const CONFIG_NAME: &str = "config.toml";
const CONFIG_BACKUP_NAME: &str = "config.toml.lust.bak";
const AUTH_NAME: &str = "auth.json";
const AUTH_BACKUP_NAME: &str = "auth.json.lust.bak";
const AUTH_CREATED_MARKER: &str = "auth.json.lust.created";

const RELAY_ROOT_KEYS: [&str; 6] = [
    "model",
    "model_reasoning_effort",
    "preferred_auth_method",
    "disable_response_storage",
    "model_provider",
    "windows_wsl_setup_acknowledged",
];

pub fn default_codex_home() -> Result<PathBuf, String> {
    dirs::home_dir()
        .map(|home| home.join(".codex"))
        .ok_or_else(|| "Could not resolve the user home directory".to_string())
}

pub fn apply_relay(api_key: &str) -> Result<(), String> {
    apply_relay_at(&default_codex_home()?, api_key)
}

pub fn exit_relay() -> Result<(), String> {
    exit_relay_at(&default_codex_home()?)
}

pub fn apply_relay_at(codex_home: &Path, api_key: &str) -> Result<(), String> {
    let api_key = api_key.trim();
    if api_key.is_empty() {
        return Err("API key is required".to_string());
    }

    fs::create_dir_all(codex_home).map_err(|err| format!("Failed to create Codex home: {err}"))?;

    let config_path = codex_home.join(CONFIG_NAME);
    let backup_path = codex_home.join(CONFIG_BACKUP_NAME);
    backup_if_needed(&config_path, &backup_path)?;

    let raw = read_or_empty(&config_path)?;
    let patched = apply_relay_toml(&raw)?;
    fs::write(&config_path, patched).map_err(|err| format!("Failed to write config.toml: {err}"))?;

    write_api_key(codex_home, api_key)
}

pub fn exit_relay_at(codex_home: &Path) -> Result<(), String> {
    let config_path = codex_home.join(CONFIG_NAME);
    let backup_path = codex_home.join(CONFIG_BACKUP_NAME);

    if backup_path.is_file() {
        fs::copy(&backup_path, &config_path)
            .map_err(|err| format!("Failed to restore config.toml: {err}"))?;
        let _ = fs::remove_file(&backup_path);
    } else if config_path.is_file() {
        let raw = read_or_empty(&config_path)?;
        let stripped = exit_relay_toml(&raw)?;
        fs::write(&config_path, stripped)
            .map_err(|err| format!("Failed to write config.toml: {err}"))?;
    }

    restore_auth(codex_home)
}

pub fn apply_relay_toml(raw: &str) -> Result<String, String> {
    let mut doc = parse_toml(raw)?;
    doc["model"] = value(RELAY_MODEL);
    doc["model_reasoning_effort"] = value("medium");
    doc["preferred_auth_method"] = value("apikey");
    doc["disable_response_storage"] = value(true);
    doc["model_provider"] = value(RELAY_PROVIDER_ID);
    doc["windows_wsl_setup_acknowledged"] = value(true);

    let mut provider = Table::new();
    provider["name"] = value(RELAY_PROVIDER_NAME);
    provider["base_url"] = value(RELAY_BASE_URL);
    provider["wire_api"] = value(RELAY_WIRE_API);
    provider["requires_openai_auth"] = value(true);

    let mut providers = match doc.remove("model_providers") {
        Some(Item::Table(table)) => table,
        _ => Table::new(),
    };
    providers[RELAY_PROVIDER_ID] = Item::Table(provider);
    doc.insert("model_providers", Item::Table(providers));

    Ok(doc.to_string())
}

pub fn exit_relay_toml(raw: &str) -> Result<String, String> {
    let mut doc = parse_toml(raw)?;
    for key in RELAY_ROOT_KEYS {
        doc.remove(key);
    }

    if let Some(Item::Table(providers)) = doc.get_mut("model_providers") {
        providers.remove(RELAY_PROVIDER_ID);
        if providers.is_empty() {
            doc.remove("model_providers");
        }
    }

    Ok(doc.to_string())
}

fn parse_toml(raw: &str) -> Result<DocumentMut, String> {
    raw.parse::<DocumentMut>()
        .map_err(|err| format!("Failed to parse config.toml: {err}"))
}

fn read_or_empty(path: &Path) -> Result<String, String> {
    if path.is_file() {
        fs::read_to_string(path).map_err(|err| format!("Failed to read {}: {err}", path.display()))
    } else {
        Ok(String::new())
    }
}

fn backup_if_needed(source: &Path, backup: &Path) -> Result<(), String> {
    if backup.is_file() {
        return Ok(());
    }
    if source.is_file() {
        fs::copy(source, backup).map_err(|err| {
            format!(
                "Failed to back up {} to {}: {err}",
                source.display(),
                backup.display()
            )
        })?;
    }
    Ok(())
}

fn write_api_key(codex_home: &Path, api_key: &str) -> Result<(), String> {
    let auth_path = codex_home.join(AUTH_NAME);
    let backup_path = codex_home.join(AUTH_BACKUP_NAME);
    let created_marker = codex_home.join(AUTH_CREATED_MARKER);

    if auth_path.is_file() {
        backup_if_needed(&auth_path, &backup_path)?;
    } else if !created_marker.is_file() {
        fs::write(&created_marker, b"1")
            .map_err(|err| format!("Failed to write auth created marker: {err}"))?;
    }

    let mut map = if auth_path.is_file() {
        parse_auth_object(&read_or_empty(&auth_path)?)?
    } else {
        Map::new()
    };
    map.insert(
        "OPENAI_API_KEY".to_string(),
        Value::String(api_key.to_string()),
    );

    let body = serde_json::to_string_pretty(&Value::Object(map))
        .map_err(|err| format!("Failed to serialize auth.json: {err}"))?;
    fs::write(&auth_path, body).map_err(|err| format!("Failed to write auth.json: {err}"))?;
    Ok(())
}

fn restore_auth(codex_home: &Path) -> Result<(), String> {
    let auth_path = codex_home.join(AUTH_NAME);
    let backup_path = codex_home.join(AUTH_BACKUP_NAME);
    let created_marker = codex_home.join(AUTH_CREATED_MARKER);

    if backup_path.is_file() {
        fs::copy(&backup_path, &auth_path)
            .map_err(|err| format!("Failed to restore auth.json: {err}"))?;
        let _ = fs::remove_file(&backup_path);
        let _ = fs::remove_file(&created_marker);
        return Ok(());
    }

    if created_marker.is_file() {
        let _ = fs::remove_file(&auth_path);
        let _ = fs::remove_file(&created_marker);
    }

    Ok(())
}

fn parse_auth_object(raw: &str) -> Result<Map<String, Value>, String> {
    if raw.trim().is_empty() {
        return Ok(Map::new());
    }
    match serde_json::from_str::<Value>(raw) {
        Ok(Value::Object(map)) => Ok(map),
        Ok(_) => Err("auth.json is not a JSON object".to_string()),
        Err(err) => Err(format!("Failed to parse auth.json: {err}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn apply_inserts_provider_without_dropping_existing_tables() {
        let input = r#"
notify = ["turn-ended"]
[desktop]
followUpQueueMode = "queue"

[mcp_servers]
"#;
        let output = apply_relay_toml(input).unwrap();
        assert!(output.contains("model = \"gpt-5.6-sol\""));
        assert!(output.contains("model_provider = \"newaigpt\""));
        assert!(output.contains("[model_providers.newaigpt]"));
        assert!(output.contains("base_url = \"https://api.admincloudai.com/v1\""));
        assert!(output.contains("[desktop]"));
        assert!(output.contains("[mcp_servers]"));
    }

    #[test]
    fn exit_strips_relay_keys_and_keeps_the_rest() {
        let applied = apply_relay_toml("[desktop]\nfollowUpQueueMode = \"queue\"\n").unwrap();
        let exited = exit_relay_toml(&applied).unwrap();
        assert!(!exited.contains("model_provider ="));
        assert!(!exited.contains("newaigpt"));
        assert!(exited.contains("[desktop]"));
    }

    #[test]
    fn apply_then_exit_restores_original_file() {
        let root = std::env::temp_dir().join(format!(
            "lust-codex-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&root).unwrap();
        let original = "notify = [\"turn-ended\"]\n[desktop]\nfollowUpQueueMode = \"queue\"\n";
        fs::write(root.join(CONFIG_NAME), original).unwrap();

        apply_relay_at(&root, "sk-test-key").unwrap();
        let patched = fs::read_to_string(root.join(CONFIG_NAME)).unwrap();
        assert!(patched.contains("model_provider = \"newaigpt\""));
        let auth = fs::read_to_string(root.join(AUTH_NAME)).unwrap();
        assert!(auth.contains("sk-test-key"));

        exit_relay_at(&root).unwrap();
        let restored = fs::read_to_string(root.join(CONFIG_NAME)).unwrap();
        assert_eq!(restored, original);
        assert!(!root.join(AUTH_NAME).exists());

        let _ = fs::remove_dir_all(&root);
    }
}
