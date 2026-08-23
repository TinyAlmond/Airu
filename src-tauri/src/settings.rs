use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Default, Clone)]
pub struct AppSettings {
    pub api_key: Option<String>,
}

fn settings_path(app: &AppHandle) -> PathBuf {
    let dir = app.path().app_data_dir().expect("no app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

pub fn load(app: &AppHandle) -> AppSettings {
    let path = settings_path(app);
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}
