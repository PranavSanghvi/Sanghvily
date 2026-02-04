import sounddevice as sd
import numpy as np
import queue

class AudioRecorder:
    def __init__(self, sample_rate=16000, channels=1):
        self.sample_rate = sample_rate
        self.channels = channels
        self.recording = False
        self.audio_queue = queue.Queue()
        self._input_stream = None
        
        # Minimum recording requirements
        self.min_duration_seconds = 0.5  # At least 0.5s to avoid "thank you" hallucination
        self.min_audio_level = 0.01       # Minimum RMS level to consider non-silent

    def start(self):
        if self.recording:
            return
        print("Audio: Starting Recording...")
        self.recording = True
        self.audio_queue = queue.Queue() # Clear queue
        
        try:
            self._input_stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                callback=self._audio_callback
            )
            self._input_stream.start()
        except Exception as e:
            print(f"Audio Error: {e}")
            self.recording = False

    def stop(self):
        if not self.recording:
            return None
        print("Audio: Stopping...")
        self.recording = False
        
        if self._input_stream:
            self._input_stream.stop()
            self._input_stream.close()
            self._input_stream = None
        
        # Collect all audio chunks
        chunks = []
        while not self.audio_queue.empty():
            chunks.append(self.audio_queue.get())
        
        if not chunks:
            return None
        
        audio_data = np.concatenate(chunks)
        
        # Validate audio duration
        duration = len(audio_data) / self.sample_rate
        if duration < self.min_duration_seconds:
            print(f"Audio: Too short ({duration:.2f}s < {self.min_duration_seconds}s), ignoring")
            return None
        
        # Validate audio level (not silent)
        rms = np.sqrt(np.mean(audio_data**2))
        if rms < self.min_audio_level:
            print(f"Audio: Too quiet (RMS={rms:.4f} < {self.min_audio_level}), ignoring")
            return None
        
        print(f"Audio: Valid recording - {duration:.2f}s, RMS={rms:.4f}")
        return audio_data

    def _audio_callback(self, indata, frames, time, status):
        if status:
            print(f"Audio Status: {status}")
        self.audio_queue.put(indata.copy())
