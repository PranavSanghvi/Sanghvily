import keyboard
import time
import threading

class HotkeyListener:
    def __init__(self, on_start, on_stop):
        self.on_start = on_start
        self.on_stop = on_stop
        self.running = False
        self._thread = None
        self.is_active = False

    def start(self):
        self.running = True
        self._thread = threading.Thread(target=self._loop)
        self._thread.daemon = True
        self._thread.start()
        print("Hotkey: Listener started")

    def stop(self):
        self.running = False
        if self._thread:
            self._thread.join(timeout=1)

    def _loop(self):
        print("Hotkey: Polling loop started")
        
        while self.running:
            try:
                ctrl_down = keyboard.is_pressed('ctrl')
                shift_down = keyboard.is_pressed('shift')
                space_down = keyboard.is_pressed('space')
                is_down = ctrl_down and shift_down and space_down
            except Exception as e:
                print(f"Hotkey: Error checking keys: {e}")
                is_down = False
            
            if is_down and not self.is_active:
                print("Hotkey: Keys PRESSED - starting recording")
                self.is_active = True
                self.on_start()
            
            elif not is_down and self.is_active:
                print("Hotkey: Keys RELEASED - stopping recording")
                self.is_active = False
                self.on_stop()
                
            time.sleep(0.05)
