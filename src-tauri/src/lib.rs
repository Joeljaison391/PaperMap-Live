pub mod security;
pub mod wallpaper;

use tauri::{Manager, Window};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn refresh_wallpaper(window: Window) {
    // The original instruction had a malformed line here.
    // Assuming the intent was to ensure wallpaper is attached,
    // and the error handling is still desired.
    // If the intent was to remove error handling, the instruction was unclear.
    if let Err(e) = wallpaper::attach(&window) {
        eprintln!("Failed to refresh wallpaper: {}", e);
    }
    // If the user intended to always attach, regardless of previous error,
    // they might have meant something like:
    // let _ = wallpaper::attach(&window); // Attach on manual call
    // However, the original code already attempts to attach.
    // Sticking to the original logic for this function as the instruction was ambiguous.
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
             // System Tray Implementation
             use tauri::menu::{Menu, MenuItem};
             use tauri::tray::TrayIconBuilder;

             let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>).unwrap();
             let menu = Menu::with_items(app, &[&quit_i]).unwrap();

             let _tray = TrayIconBuilder::new()
                 .menu(&menu)
                 .show_menu_on_left_click(true)
                 .icon(app.default_window_icon().unwrap().clone())
                 .on_menu_event(|app, event| {
                     match event.id.as_ref() {
                         "quit" => {
                             app.exit(0);
                         }
                         _ => {}
                     }
                 })
                 .build(app)?;
             
             Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![refresh_wallpaper])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
