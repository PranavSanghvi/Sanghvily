import time
import ctypes
import pyperclip
import keyboard

# Win32 API for focus management
user32 = ctypes.windll.user32

# Global to store the captured foreground window handle
_captured_hwnd = None

def capture_focus():
    """
    Save the current foreground window handle.
    Call this BEFORE recording starts so we know where to inject text later.
    """
    global _captured_hwnd
    _captured_hwnd = user32.GetForegroundWindow()
    print(f"Focus: Captured HWND = {_captured_hwnd}")

def restore_focus():
    """
    Restore focus to the previously captured window.
    Call this BEFORE injecting text.
    """
    global _captured_hwnd
    if _captured_hwnd:
        print(f"Focus: Restoring to HWND = {_captured_hwnd}")
        # SetForegroundWindow can be picky, so we use a workaround
        # First, attach to the thread that owns the window
        current_thread = ctypes.windll.kernel32.GetCurrentThreadId()
        target_thread = user32.GetWindowThreadProcessId(_captured_hwnd, None)
        
        if current_thread != target_thread:
            user32.AttachThreadInput(current_thread, target_thread, True)
        
        user32.SetForegroundWindow(_captured_hwnd)
        user32.BringWindowToTop(_captured_hwnd)
        
        if current_thread != target_thread:
            user32.AttachThreadInput(current_thread, target_thread, False)
        
        time.sleep(0.05)  # Small delay to let focus settle

def inject_text(text):
    if not text:
        return

    print(f"Injecting: {text}")
    
    # Restore focus to the original window before injection
    restore_focus()
    
    # If text is short, type it out (looks cooler, lower risk of clipboard race)
    if len(text) < 50:
        keyboard.write(text)
    else:
        # Smart Paste
        try:
            old_clipboard = pyperclip.paste()
        except:
            old_clipboard = ""

        pyperclip.copy(text)
        
        # Send Ctrl+V
        keyboard.send('ctrl+v')
        
        # Wait a bit for paste to register before restoring
        time.sleep(0.2)
        
        try:
            pyperclip.copy(old_clipboard)
        except:
            pass
