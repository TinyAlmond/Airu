use tauri::{
    AppHandle,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit Airu", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit])?;

    TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Airu - Desktop Pet")
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                app.exit(0);
            }
        })
        .build(app)?;

    Ok(())
}
