import time
import pyperclip
import keyboard

def inject_text(text):
    if not text:
        return

    print(f"Injecting: {text}")
    
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
