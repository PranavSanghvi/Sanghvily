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
        # Default hotkey: Ctrl+Shift+Space
        self.keys = ['ctrl', 'shift', 'space']

    def set_hotkey(self, key_string):
        """
        Set a new hotkey from a string like "ctrl+shift+a".
        """
        if not key_string:
            return
        
        # Parse the hotkey string into a list of keys
        new_keys = [k.strip().lower() for k in key_string.split('+')]
        
        # Validation: require at least 2 keys
        if len(new_keys) < 2:
            print(f"Hotkey: Invalid - need at least 2 keys, got {len(new_keys)}")
            return
        
        self.keys = new_keys
        print(f"Hotkey: Updated to {self.keys}")

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
                # Check if ALL keys in self.keys are pressed
                is_down = all(keyboard.is_pressed(key) for key in self.keys)
            except Exception as e:
                print(f"Hotkey: Error checking keys: {e}")
                is_down = False
            
            if is_down and not self.is_active:
                print(f"Hotkey: Keys PRESSED ({'+'.join(self.keys)}) - starting recording")
                self.is_active = True
                self.on_start()
            
            elif not is_down and self.is_active:
                print("Hotkey: Keys RELEASED - stopping recording")
                self.is_active = False
                self.on_stop()
                
            time.sleep(0.05)
