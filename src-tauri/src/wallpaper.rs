use tauri::{Runtime, Window};
use raw_window_handle::HasWindowHandle;
use windows::core::PCSTR;
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, RECT, WPARAM};
use windows::Win32::Graphics::Gdi::{EnumDisplayMonitors, HDC, HMONITOR};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, FindWindowA, FindWindowExA, GetClientRect, GetWindowLongPtrA, SendMessageA, SetParent, 
    SetWindowLongPtrA, SetWindowPos, GWL_EXSTYLE, GWL_STYLE, HWND_BOTTOM, SWP_SHOWWINDOW, SWP_FRAMECHANGED, 
    WS_CHILD, WS_VISIBLE, WS_CAPTION, WS_THICKFRAME, WS_MINIMIZEBOX, WS_MAXIMIZEBOX, WS_SYSMENU, WS_POPUP,
    WS_EX_NOACTIVATE, WS_EX_TOOLWINDOW,
};

// Callback data structure to hold the found WorkerW
struct EnumData {
    workerw: HWND,
}

unsafe extern "system" fn enum_window_callback(top_handle: HWND, lparam: LPARAM) -> BOOL {
    let p_data = lparam.0 as *mut EnumData;
    
    // Check if this window contains SHELLDLL_DefView
    // FindWindowExA(parent, child_after, class, window)
    let shell_dll = FindWindowExA(
        top_handle,
        HWND(0),
        PCSTR(b"SHELLDLL_DefView\0".as_ptr()),
        PCSTR::null(),
    );

    if shell_dll.0 != 0 {
        let worker = FindWindowExA(
            HWND(0), 
            top_handle, 
            PCSTR(b"WorkerW\0".as_ptr()), 
            PCSTR::null()
        );
        
        if worker.0 != 0 {
            (*p_data).workerw = worker;
        }
        
        return BOOL(0); // Stop enumeration
    }
    BOOL(1)
}

pub fn attach<R: Runtime>(window: &Window<R>) -> Result<(), String> {
    unsafe {
        let progman = FindWindowA(PCSTR(b"Progman\0".as_ptr()), PCSTR::null());
        
        // Spawn WorkerW
        SendMessageA(progman, 0x052C, WPARAM(0xd), LPARAM(0));

        let mut data = EnumData { workerw: HWND(0) };
        
        EnumWindows(Some(enum_window_callback), LPARAM(&mut data as *mut _ as isize));

        if data.workerw.0 != 0 {
            // Get Tauri window handle
             let hwnd = window.window_handle().map_err(|e| e.to_string())?.as_raw();
             
             #[cfg(target_os = "windows")]
             {
                 use raw_window_handle::RawWindowHandle;
                 if let RawWindowHandle::Win32(handle) = hwnd {
                     // For windows 0.52.0 HWND(isize)
                     let tauri_hwnd = HWND(handle.hwnd.get() as isize);
                     
                     // 1. Set Parent to WorkerW
                     let _ = SetParent(tauri_hwnd, data.workerw);
                     
                     // 2. Remove Popup style, add Child style, strip borders
                     // Also set WS_EX_NOACTIVATE to prevent stealing focus
                     let style = GetWindowLongPtrA(tauri_hwnd, GWL_STYLE);
                     let new_style = (style & !(WS_POPUP.0 as isize)) 
                                     & !(WS_CAPTION.0 as isize) 
                                     & !(WS_THICKFRAME.0 as isize) 
                                     & !(WS_MINIMIZEBOX.0 as isize) 
                                     & !(WS_MAXIMIZEBOX.0 as isize) 
                                     & !(WS_SYSMENU.0 as isize)
                                     | (WS_CHILD.0 as isize) 
                                     | (WS_VISIBLE.0 as isize);

                     let _ = SetWindowLongPtrA(tauri_hwnd, GWL_STYLE, new_style);
                     
                     // Set extended style to prevent activation
                     let ex_style = GetWindowLongPtrA(tauri_hwnd, GWL_EXSTYLE);
                     let new_ex_style = ex_style | (WS_EX_NOACTIVATE.0 as isize) | (WS_EX_TOOLWINDOW.0 as isize);
                     let _ = SetWindowLongPtrA(tauri_hwnd, GWL_EXSTYLE, new_ex_style);
                     
                     // 3. Get size of WorkerW (the desktop)
                     let mut rect = RECT::default();
                     let _ = GetClientRect(data.workerw, &mut rect);
                     let width = rect.right - rect.left;
                     let height = rect.bottom - rect.top;

                     // 4. Position it correctly covering the whole area
                     let _ = SetWindowPos(
                         tauri_hwnd, 
                         HWND_BOTTOM, 
                         0, 
                         0, 
                         width, 
                         height, 
                         SWP_SHOWWINDOW | SWP_FRAMECHANGED
                     );
                 }
             }
            
            Ok(())
        } else {
            Err("Could not find WorkerW".into())
        }
    }
}
