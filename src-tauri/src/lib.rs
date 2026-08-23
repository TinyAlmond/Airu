mod commands;
mod settings;
mod tray;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_settings,
            commands::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Airu");
}
