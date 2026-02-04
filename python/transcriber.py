import os
import io
import wave
import numpy as np

class Transcriber:
    def __init__(self, api_key=None):
        # Import here to allow module loading even if deps aren't ready yet (for testing)
        try:
            from groq import Groq
            self.Groq = Groq
        except ImportError:
            self.Groq = None
            print("Transcriber: Groq module not found")
            
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        self.model = "whisper-large-v3-turbo" # Default
        self.client = None
        if self.Groq and self.api_key:
            self.client = self.Groq(api_key=self.api_key)

    def set_model(self, model):
        self.model = model
        print(f"Transcriber: Model set to {self.model}")

    def set_api_key(self, key):
        self.api_key = key
        if self.Groq:
            self.client = self.Groq(api_key=self.api_key)

    def validate_connection(self):
        if not self.client:
            return False
        try:
            # Cheap call to list models to verify auth
            self.client.models.list()
            return True
        except Exception as e:
            print(f"Validation Error: {e}")
            return False

    # Known Whisper hallucinations when audio is unclear/short
    HALLUCINATION_PHRASES = [
        "thank you",
        "thanks for watching",
        "thank you for watching",
        "thanks for listening",
        "thank you for listening",
        "bye",
        "goodbye",
        "see you next time",
        "subscribe",
        "like and subscribe",
    ]

    def transcribe(self, audio_data, prompt=None, sample_rate=16000):
        if not self.client:
            print("Transcriber: Client not initialized (Missing Key or Lib)")
            return None
        
        # Convert float32 numpy array to int16 bytes
        audio_int16 = (audio_data * 32767).astype(np.int16)
        
        buffer = io.BytesIO()
        with wave.open(buffer, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2) # 16 bit
            wf.setframerate(sample_rate)
            wf.writeframes(audio_int16.tobytes())
        
        buffer.seek(0)
        
        try:
            # Prepare arguments
            transcribe_args = {
                "file": ("audio.wav", buffer),
                "model": self.model, 
                "response_format": "json",
                "language": "en",  # Specify language to reduce hallucinations
                "temperature": 0.0
            }
            
            # Add prompt if provided (for context/vocabulary)
            if prompt:
                print(f"Transcriber: Using context prompt: '{prompt[:20]}...'")
                transcribe_args["prompt"] = prompt

            completion = self.client.audio.transcriptions.create(**transcribe_args)
            
            text = completion.text.strip()
            
            # Filter out known hallucinations
            if text.lower() in self.HALLUCINATION_PHRASES:
                print(f"Transcriber: Filtered hallucination: '{text}'")
                return None
            
            return text
        except Exception as e:
            error_str = str(e)
            if "401" in error_str:
                print(f"Transcribe Error: Invalid API Key")
                return None # The main loop will handle Generic errors, but we might want to be specific
            elif "404" in error_str:
                 print(f"Transcribe Error: Model not found or API endpoint invalid")
                 return None
            
            print(f"Transcribe Error: {e}")
            raise e # Re-raise so main.py catches it and sends "error" event
