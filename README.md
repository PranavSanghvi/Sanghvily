# Sanghvily 🎙️

**Sanghvily** is a modern, AI-powered system-wide dictation tool for Windows. It allows you to use your voice to type anywhere, instantly, using the power of Groq's high-performance LLM inference (Whisper).

![Sanghvily App](resources/icon.png)

## Features

-   **System-Wide Dictation**: Use `Ctrl + Win` (hold) to record, and release to transcribe.
-   **Lighting Fast**: Powered by Groq Cloud for near-instant transcription.
-   **Smart Context**: Define custom vocabulary or context prompts to improve accuracy for niche terms (medical, coding, etc.).
-   **Modern UI**: Sleek, glassmorphic interface built with React and Tailwind CSS.
-   **Validation**: Proactive API key validation and system status monitoring.

## Technology Stack

-   **Frontend**: Electron, React, TypeScript, Tailwind CSS
-   **Backend**: Python, PyAudio, Groq SDK
-   **Packaging**: PyInstaller (Python), Electron-Builder (Windows Installer)

## Prerequisites

-   **Node.js** (v18 or higher)
-   **Python** (v3.10 or higher)
-   **Groq API Key**: Get one from [console.groq.com](https://console.groq.com)

## Development Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/PranavSanghvi/Sanghvily.git
    cd sanghvily
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Python Backend**
    ```bash
    # Create virtual environment
    python -m venv python/venv
    
    # Activate it (Windows)
    .\python\venv\Scripts\activate
    
    # Install Python requirements
    pip install -r python/requirements.txt
    ```

4.  **Run Development Mode**
    ```bash
    # Terminal 1: Start React Dev Server
    npm run dev
    
    # Terminal 2: Start Electron (which spawns Python)
    npm run electron:dev
    ```

## Building for Production

To create the Windows Installer (`.exe`):

1.  **Build Python Backend**
    ```bash
    # This bundles the Python scripts into a single executable
    .\python\venv\Scripts\pyinstaller.exe --noconfirm --onefile --console --name main --icon="resources/icon.ico" --distpath resources/python --workpath python/build --specpath python python/main.py
    ```

2.  **Build Electron App**
    ```bash
    npm run build:win
    ```
    The installer will be in the `dist/` directory.

## License

MIT License. See [LICENSE](LICENSE) for details.

---
Developed by [Pranav Sanghvi](https://github.com/PranavSanghvi/)
