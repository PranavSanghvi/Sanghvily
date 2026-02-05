import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Layout } from './components/Layout'
import { GeneralSettings } from './components/GeneralSettings'
import { DictationModels } from './components/DictationModels'
import { HistoryTab } from './components/HistoryTab'
import { ModelPrompts } from './components/ModelPrompts'

function App() {
  const [currentTab, setCurrentTab] = useState('general')
  const [status, setStatus] = useState("Ready")
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("apiKey") || "")
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("selectedModel") || "whisper-large-v3-turbo")
  const [transcribedText, setTranscribedText] = useState("")
  const [appStatus, setAppStatus] = useState<'online' | 'offline' | 'error' | 'warning'>('online')
  const [hotkey, setHotkey] = useState(() => localStorage.getItem("hotkey") || "ctrl+shift+space")

  // Model Prompts are now handled internally by ModelPrompts component

  const [history, setHistory] = useState<any[]>(() => {
      const saved = localStorage.getItem("history")
      return saved ? JSON.parse(saved) : []
  })
  const [isHistoryEnabled, setIsHistoryEnabled] = useState(() => {
      const saved = localStorage.getItem("isHistoryEnabled")
      return saved ? JSON.parse(saved) : true
  })

  // Initial Sync with Backend
  useEffect(() => {
    if (apiKey) {
        // @ts-ignore
        window.electron.ipcRenderer.send('set-api-key', apiKey);
    }
    // @ts-ignore
    window.electron.ipcRenderer.send('set-model', selectedModel);
    // @ts-ignore
    window.electron.ipcRenderer.send('set-hotkey', localStorage.getItem("hotkey") || "ctrl+shift+space");
  }, []) // Run once on mount to sync stored values

  // Persist History settings
  useEffect(() => {
      localStorage.setItem("history", JSON.stringify(history))
  }, [history])

  useEffect(() => {
      localStorage.setItem("isHistoryEnabled", JSON.stringify(isHistoryEnabled))
  }, [isHistoryEnabled])

  useEffect(() => {
    // Listen for backend events
    // @ts-ignore
    const removeListener = window.electron.ipcRenderer.on('backend-event', (_, data) => {
        console.log("Backend Event:", data);
        if (data.event === 'recording_started') setStatus("Listening...");
        if (data.event === 'recording_stopped') setStatus("Processing...");
        if (data.event === 'recording_cancelled') setStatus("Ready"); // Audio was too short/quiet
        if (data.event === 'transcribing') setStatus("Transcribing...");
        if (data.event === 'refining') setStatus(`Refining...`);
        if (data.event === 'transcribed') {
             // Intermediate - logic moved to 'done' or handled by refinement
        }
        if (data.event === 'done') {
            setStatus("Ready");
            setTranscribedText(data.text);
             if (appStatus === 'error') setAppStatus('online');

            // Add to History
            if (isHistoryEnabled && data.text) {
                const newItem = {
                    id: Date.now().toString(),
                    text: data.text,
                    time: new Date().toISOString(),
                    model: selectedModel
                }
                setHistory(prev => [newItem, ...prev])
            }
        }
        
        if (data.event === 'error') {
             setStatus(`Error: ${data.message}`);
             setAppStatus('error');
             // Notification Logic
             if (document.visibilityState === 'hidden') {
                 new Notification('Sanghvily Error', {
                     body: data.message,
                     icon: '../assets/icon.png' // Might need absolute path or require
                 });
             }
        }

        if (data.event === 'api_status') {
            if (data.status === 'invalid') {
                setAppStatus('warning')
                setStatus("API Key Missing/Invalid")
            } else if (data.status === 'valid') {
                if (appStatus !== 'offline') setAppStatus('online')
            }
        }

        if (data.event === 'notification') {
             // Show System Notification
             new Notification(data.title, {
                 body: data.body,
                 silent: false
             });
        }
    });

    // Listen for Tray Toggle
    // @ts-ignore
    const removeToggleListener = window.electron.ipcRenderer.on('toggle-status', () => {
        toggleAppStatus();
    });

    return () => {
        if (removeListener) removeListener(); 
        if (removeToggleListener) removeToggleListener();
    }
  }, [appStatus, isHistoryEnabled, selectedModel])

  const saveKey = () => {
    // Save to LocalStorage
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("selectedModel", selectedModel);

    // @ts-ignore
    window.electron.ipcRenderer.send('set-api-key', apiKey);
    // @ts-ignore
    window.electron.ipcRenderer.send('set-model', selectedModel);
    
    alert("Settings Saved"); 
    setAppStatus('online'); // Assume fixed if user saves settings
  }

  const toggleAppStatus = () => {
      const newStatus = appStatus === 'offline' ? 'online' : 'offline';
      setAppStatus(newStatus);
      
      // Sync with Main Process (for Window Close logic)
      // @ts-ignore
      window.electron.ipcRenderer.send('set-app-status', newStatus);

      // Sync with Python Backend (to pause/unpause listener)
      // @ts-ignore
      window.electron.ipcRenderer.send('set-paused', newStatus === 'offline');
  }

  // History Actions
  const deleteHistoryItem = (id: string) => {
      setHistory(prev => prev.filter(item => item.id !== id))
  }
  
  const clearHistory = () => {
      if(confirm("Clear all history?")) setHistory([])
  }

  // Render Content based on Tab
  const renderContent = () => {
    switch (currentTab) {
      case 'general':
        return <GeneralSettings 
                  status={status} 
                  appStatus={appStatus}
                  hotkey={hotkey}
                  onHotkeyChange={(newHotkey) => {
                    setHotkey(newHotkey)
                    localStorage.setItem("hotkey", newHotkey)
                    // @ts-ignore
                    window.electron.ipcRenderer.send('set-hotkey', newHotkey)
                  }}
               />
      case 'models':
        return <DictationModels 
                  apiKey={apiKey} 
                  setApiKey={setApiKey} 
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  saveKey={saveKey} 
                  appStatus={appStatus}
               />
      case 'history':
        return <HistoryTab 
                  history={history}
                  onDelete={deleteHistoryItem}
                  onClear={clearHistory}
                  isEnabled={isHistoryEnabled}
                  onToggleEnabled={() => setIsHistoryEnabled(!isHistoryEnabled)}
               />
      case 'prompts':
        return <ModelPrompts />
      default:
        return <GeneralSettings 
                  status={status} 
                  appStatus={appStatus}
               />
    }
  }

  return (
    <Layout sidebar={
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        appStatus={appStatus}
        onToggleStatus={toggleAppStatus}
      />
    }>
      {renderContent()}
    </Layout>
  )
}

export default App
