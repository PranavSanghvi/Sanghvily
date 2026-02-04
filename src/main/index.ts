import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn, ChildProcess } from 'child_process'

let pythonProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let isAppOffline = false;

function startPythonBackend() {
  let executable: string;
  let args: string[] = [];

  if (is.dev) {
    executable = join(process.cwd(), 'python', 'venv', 'Scripts', 'python.exe');
    args = [join(process.cwd(), 'python', 'main.py')];
  } else {
    // In production, we expect the standalone exe at resources/python/main.exe
    executable = join(process.resourcesPath, 'python', 'main.exe');
    args = [];
  }
  
  console.log(`SPK: Starting Backend: ${executable} ${args.join(' ')}`);
  
  try {
      pythonProcess = spawn(executable, args);
      
      pythonProcess.stdout?.on('data', (data) => {
        const str = data.toString().trim();
        console.log(`PY: ${str}`);
        const lines = str.split('\n');
        for (const line of lines) {
            try {
                const json = JSON.parse(line);
                mainWindow?.webContents.send('backend-event', json);
            } catch (e) { }
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        console.error(`PY ERR: ${data.toString()}`);
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        pythonProcess = null;
      });
      
  } catch (error) {
      console.error("Failed to spawn python", error);
  }
}

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Sanghvily', enabled: false },
    { type: 'separator' },
    { 
        label: isAppOffline ? 'Disabled (Offline)' : 'Enabled (Online)', 
        type: 'checkbox', 
        checked: !isAppOffline,
        click: () => {
            // Toggle local state temporarily
            isAppOffline = !isAppOffline;
            updateTrayMenu();
            
            // Notify Renderer to update UI (which will then sync back to Main/Python)
            mainWindow?.webContents.send('toggle-status');
        } 
    },
    { type: 'separator' },
    { label: 'Show Window', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
    }}
  ]);
  
  tray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = join(__dirname, '../../resources/icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  tray.setToolTip('Sanghvily');
  
  updateTrayMenu();
  
  tray.on('double-click', () => {
      mainWindow?.show();
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: "Sanghvily",
    frame: false, // Frameless window
    autoHideMenuBar: true,
    icon, // Set icon for all platforms
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.setTitle("Sanghvily");
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  
  // Minimize to tray logic
  mainWindow.on('close', (event) => {
      if (!isQuitting) {
          event.preventDefault();
          mainWindow?.hide();
      }
      return false;
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow!.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow!.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    app.setName("Sanghvily");
    electronApp.setAppUserModelId('com.sanghvily')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('set-api-key', (_, key) => {
      if (pythonProcess && pythonProcess.stdin) {
          const msg = JSON.stringify({ command: 'set_api_key', key });
          pythonProcess.stdin.write(msg + '\n');
      }
  })

  ipcMain.on('set-model', (_, model) => {
    if (pythonProcess && pythonProcess.stdin) {
        const msg = JSON.stringify({ command: 'set_model', model });
        pythonProcess.stdin.write(msg + '\n');
    }
  })

  ipcMain.on('set-paused', (_, paused) => {
    console.log(`IPC: set-paused received: ${paused}, type: ${typeof paused}`);
    isAppOffline = paused; 
    updateTrayMenu(); // Update Tray UI to match Renderer
    if (pythonProcess && pythonProcess.stdin) {
        const msg = JSON.stringify({ command: 'set_paused', paused });
        pythonProcess.stdin.write(msg + '\n');
    }
  })

  ipcMain.on('set-hotkey', (_, hotkey) => {
    if (pythonProcess && pythonProcess.stdin) {
         const msg = JSON.stringify({ command: 'set_hotkey', hotkey });
         pythonProcess.stdin.write(msg + '\n');
    }
  })

  ipcMain.on('set-active-prompt', (_, data) => {
    // data = { id, template }
    if (pythonProcess && pythonProcess.stdin) {
         const msg = JSON.stringify({ command: 'set_active_prompt', ...data });
         pythonProcess.stdin.write(msg + '\n');
    }
  })

  // Window Control IPC
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize()
    } else {
        mainWindow?.maximize()
    }
  })

  ipcMain.on('close-window', () => {
    console.log(`IPC: close-window received. isAppOffline: ${isAppOffline}`);
    if (isAppOffline) {
        console.log("Quitting app because offline...");
        isQuitting = true;
        app.quit(); // Actually quit if offline
    } else {
        console.log("Minimizing to tray...");
        mainWindow?.hide() // Minimize to tray if online/error
    }
  })


  startPythonBackend();
  createWindow();
  
  // Force Title Update
  if (mainWindow) {
      mainWindow.setTitle("Sanghvily");
  }

  createTray();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
}

app.on('window-all-closed', () => {
  // Do nothing, keep running in tray
})

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
})
