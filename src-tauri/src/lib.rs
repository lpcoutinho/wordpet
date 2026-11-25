use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow, WindowEvent,
};

fn position_window(window: &WebviewWindow) {
    let Ok(Some(monitor)) = window.current_monitor() else {
        return;
    };
    let Ok(size) = window.outer_size() else {
        return;
    };
    let x = monitor.position().x + monitor.size().width as i32 - size.width as i32 - 16;
    let y = monitor.position().y + monitor.size().height as i32 - size.height as i32 - 56;
    let _ = window.set_position(PhysicalPosition::new(x, y));
}

fn resize_window(app: &AppHandle, width_delta: i32, height_delta: i32) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let width = if width_delta == 0 && height_delta == 0 {
        560
    } else {
        let Ok(size) = window.outer_size() else {
            return;
        };
        (size.width as i32 + width_delta).clamp(360, 1200) as u32
    };
    let height = if width_delta == 0 && height_delta == 0 {
        260
    } else {
        let Ok(size) = window.outer_size() else {
            return;
        };
        (size.height as i32 + height_delta).clamp(260, 900) as u32
    };
    let _ = window.set_size(PhysicalSize::new(width, height));
    position_window(&window);
}

fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            position_window(&window);
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                position_window(&window);
            }
            let toggle = MenuItem::with_id(app, "toggle", "Mostrar / ocultar", true, None::<&str>)?;
            let bigger = MenuItem::with_id(app, "bigger", "Aumentar", true, None::<&str>)?;
            let smaller = MenuItem::with_id(app, "smaller", "Diminuir", true, None::<&str>)?;
            let reset = MenuItem::with_id(app, "reset", "Tamanho inicial", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle, &bigger, &smaller, &reset, &quit])?;
            let icon = app.default_window_icon().cloned().expect("missing app icon");
            let tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("wordpet")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => toggle_window(app),
                    "bigger" => resize_window(app, 80, 40),
                    "smaller" => resize_window(app, -80, -40),
                    "reset" => resize_window(app, 0, 0),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            app.manage(tray);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running wordpet");
}
