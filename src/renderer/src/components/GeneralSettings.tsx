import { useState, useEffect, useCallback } from 'react'
import { Keyboard, Mic, RotateCcw } from 'lucide-react'

interface GeneralSettingsProps {
  status: string
  appStatus: 'online' | 'offline' | 'error' | 'warning'
  hotkey: string
  onHotkeyChange: (newHotkey: string) => void
}

const DEFAULT_HOTKEY = "ctrl+shift+space"

export function GeneralSettings({ status, appStatus, hotkey, onHotkeyChange }: GeneralSettingsProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedKeys, setCapturedKeys] = useState<string[]>([])

  // Derive display status
  const isListening = status === 'Listening...'
  const isProcessing = status === 'Processing...' || status === 'Transcribing...'
  
  // Determine Mic Colors based on AppStatus + Activity
  let micColorClass = "bg-blue-50 text-blue-500" // Default Ready
  let statusText = "System Online"
  let statusDesc = "Ready to record"

  if (appStatus === 'offline') {
      micColorClass = "bg-red-50 text-red-500"
      statusText = "System Offline"
      statusDesc = "Recording disabled"
  } else if (appStatus === 'error') {
      micColorClass = "bg-amber-50 text-amber-500"
      statusText = "System Error"
      statusDesc = "Please check your settings"
  } else if (appStatus === 'warning') {
      micColorClass = "bg-yellow-50 text-yellow-600 animate-pulse"
      statusText = "API Key Invalid"
      statusDesc = "Please update your API Key"
  } else {
      // Online
      if (isListening) {
          micColorClass = "bg-green-50 text-green-600 animate-pulse"
          statusText = "Listening..."
          statusDesc = "Release keys to process"
      } else if (isProcessing) {
          micColorClass = "bg-amber-50 text-amber-500 animate-pulse"
          statusText = "Processing..."
          statusDesc = "Transcribing speech..."
      }
  }

  // Parse hotkey string into array for display
  const hotkeyParts = hotkey.split('+').map(k => k.trim())

  // Key capture handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const keys: string[] = []
    
    if (e.ctrlKey) keys.push('ctrl')
    if (e.shiftKey) keys.push('shift')
    if (e.altKey) keys.push('alt')
    
    // Add the main key if it's not a modifier
    const key = e.key.toLowerCase()
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      keys.push(key === ' ' ? 'space' : key)
    }
    
    setCapturedKeys(keys)
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    // When all keys are released, save if we have at least 2 keys
    if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
      if (capturedKeys.length >= 2) {
        const newHotkey = capturedKeys.join('+')
        onHotkeyChange(newHotkey)
        setIsCapturing(false)
        setCapturedKeys([])
      }
    }
  }, [capturedKeys, onHotkeyChange])

  useEffect(() => {
    if (isCapturing) {
      window.addEventListener('keydown', handleKeyDown, true)
      window.addEventListener('keyup', handleKeyUp, true)
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true)
        window.removeEventListener('keyup', handleKeyUp, true)
      }
    }
  }, [isCapturing, handleKeyDown, handleKeyUp])

  // Cancel capture on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCapturing) {
        setIsCapturing(false)
        setCapturedKeys([])
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isCapturing])

  const renderKeyBadge = (key: string, index: number) => (
    <span key={index} className="flex items-center gap-1.5">
      {index > 0 && <span className="text-zinc-300 text-sm font-medium">+</span>}
      <kbd className="min-w-[42px] h-8 px-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 border-b-2 rounded-lg text-zinc-500 text-xs font-mono font-bold shadow-sm capitalize">
        {key}
      </kbd>
    </span>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-6">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">General Settings</h2>

      {/* Status Section */}
      <section className="space-y-3">
         <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">System Status</h3>
         <div className="relative overflow-hidden rounded-xl bg-white border border-zinc-200 p-6 flex items-center gap-6 shadow-sm">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${micColorClass}`}>
                <Mic size={24} />
            </div>
            <div>
                 <h3 className="text-lg font-semibold text-zinc-900">{statusText}</h3>
                 <p className="text-zinc-500 text-sm">{statusDesc}</p>
            </div>
         </div>
      </section>

      {/* Hotkeys Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Shortcuts</h3>
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
                        <Keyboard size={18} />
                    </div>
                    <div>
                        <p className="text-zinc-900 font-medium">Global Record</p>
                        <p className="text-xs text-zinc-500">Hold to activate recording</p>
                    </div>
                </div>
                
                {isCapturing ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg animate-pulse">
                      {capturedKeys.length > 0 ? (
                        capturedKeys.map((key, i) => renderKeyBadge(key, i))
                      ) : (
                        <span className="text-blue-500 text-sm font-medium">Press keys...</span>
                      )}
                    </div>
                    <button 
                      onClick={() => { setIsCapturing(false); setCapturedKeys([]) }}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {hotkeyParts.map((key, i) => renderKeyBadge(key, i))}
                    </div>
                    <button 
                      onClick={() => setIsCapturing(true)}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                    >
                      Change
                    </button>
                    {hotkey !== DEFAULT_HOTKEY && (
                      <button 
                        onClick={() => onHotkeyChange(DEFAULT_HOTKEY)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                        title="Reset to default"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )}
            </div>
        </div>
      </section>
      
    </div>
  )
}
