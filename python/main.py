import sys
import time
import json
import os
import threading
from dotenv import load_dotenv

# Load env from .env file if present
load_dotenv()

try:
    from hotkey import HotkeyListener
    from audio import AudioRecorder
    from transcriber import Transcriber
    from injector import inject_text
except ImportError as e:
    print(json.dumps({"event": "error", "message": f"Import Error: {e}"}))
    sys.stdout.flush()
    sys.exit(1)

def main():
    print("SPK: Backend Started")
    sys.stdout.flush()

    # Initialize Components
    try:
        recorder = AudioRecorder()
        transcriber = Transcriber() # Reads GROQ_API_KEY from env
    except Exception as e:
        print_json({"event": "error", "message": f"Init Error: {e}"})
        return

    # Lock for processing status
    processing_lock = threading.Lock()
    
    is_paused = False
    active_prompt_template = None # Store active prompt

    def on_recording_start():
        nonlocal is_paused
        if is_paused:
             print_json({"event": "debug", "msg": "Ignored: App is Paused"})
             return
             
        # print_json({"event": "debug", "msg": "Hotkey Pressed"})
        if processing_lock.locked():
            return
        print_json({"event": "recording_started"})
        recorder.start()

    def on_recording_stop():
        nonlocal is_paused
        if is_paused:
            return

        # print_json({"event": "debug", "msg": "Hotkey Released"})
        # Stop returns audio data
        audio_data = recorder.stop()
        
        if audio_data is None:
            # Maybe just a micro-tap? Ignore.
            print_json({"event": "recording_cancelled"})
            return
            
        print_json({"event": "recording_stopped"})

        # Start processing in a thread
        t = threading.Thread(target=process_audio, args=(audio_data,))
        t.start()
        
    def process_audio(audio_data):
        nonlocal active_prompt_template
        if not processing_lock.acquire(blocking=False):
            return

        try:
            print_json({"event": "transcribing"})
            
            # Pass active_prompt_template as context prompt
            text = transcriber.transcribe(audio_data, prompt=active_prompt_template)
            
            if text:
                print_json({"event": "transcribed", "text": text})
                
                # No more Llama 3 refinement step
                # The text is already influenced by the context prompt
                
                inject_text(text)
                print_json({"event": "done", "text": text}) # Send final text for UI History
            else:
                # If None is returned but no exception raised within transcribe (handled there), standard msg
                 pass 
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg:
                error_msg = "Invalid API Key. Please check your settings."
            elif "rate limit" in error_msg.lower():
                error_msg = "Rate limit exceeded. Please wait a moment."
            
            print_json({"event": "error", "message": error_msg})
        finally:
            processing_lock.release()

    # Initial Connection Check (Threaded to not block)
    def check_connection():
        is_valid = transcriber.validate_connection()
        status = "valid" if is_valid else "invalid"
        print_json({"event": "api_status", "status": status})
        
        if not is_valid:
            print_json({
                "event": "notification", 
                "title": "API Key Invalid", 
                "body": "Please check your Dictation Models settings."
            })

    threading.Thread(target=check_connection).start()

    listener = HotkeyListener(
        on_start=on_recording_start,
        on_stop=on_recording_stop
    )
    listener.start()

    try:
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            
            # Parse IPC
            try:
                msg = json.loads(line.strip())
                if msg.get("command") == "set_api_key":
                    key = msg.get("key")
                    transcriber.set_api_key(key)
                    if key:
                        os.environ["GROQ_API_KEY"] = key
                    print_json({"event": "api_key_set", "success": True})
                    
                    # Re-validate
                    threading.Thread(target=check_connection).start()

                if msg.get("command") == "set_model":
                    model = msg.get("model")
                    transcriber.set_model(model)
                    print_json({"event": "model_set", "model": model})

                if msg.get("command") == "set_paused":
                    is_paused = msg.get("paused", False)
                    state_str = "Paused" if is_paused else "Resumed"
                    print_json({"event": "debug", "msg": f"Backend {state_str}"})
                    
                    # Run validation when going Online
                    if not is_paused:
                         threading.Thread(target=check_connection).start()

                if msg.get("command") == "set_hotkey":
                    new_hotkey = msg.get("hotkey")
                    if new_hotkey:
                        listener.set_hotkey(new_hotkey)
                        print_json({"event": "debug", "msg": f"Hotkey Updated: {new_hotkey}"})

                if msg.get("command") == "set_active_prompt":
                    prompt_id = msg.get("id")
                    template = msg.get("template") 
                    active_prompt_template = template # template string or None
                    print_json({"event": "debug", "msg": f"Active Prompt Set: {prompt_id}"})

            except json.JSONDecodeError:
                pass
                
    except KeyboardInterrupt:
        pass
    finally:
        listener.stop()

def print_json(data):
    print(json.dumps(data))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
