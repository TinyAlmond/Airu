use crate::settings::{self, AppSettings};
use tauri::AppHandle;

#[tauri::command]
pub fn load_settings(app: AppHandle) -> AppSettings {
    settings::load(&app)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    settings::save(&app, &settings)
}
