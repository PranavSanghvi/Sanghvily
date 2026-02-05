import { useState, useEffect, useCallback, useRef } from 'react'
import { Keyboard, Mic, RotateCcw } from 'lucide-react'

interface GeneralSettingsProps {
  status: string
  appStatus: 'online' | 'offline' | 'error' | 'warning'
  hotkey: string
  onHotkeyChange: (newHotkey: string) => void
}

const DEFAULT_HOTKEY = "ctrl+shift+space"

// Map browser key names to Python 'keyboard' library names
const KEY_MAP: Record<string, string> = {
  'control': 'ctrl',
  'meta': 'windows', // 'win' or 'windows' both work usually, windows is safer
  'alt': 'alt',
  'shift': 'shift',
  ' ': 'space',
  'escape': 'esc'
}

export function GeneralSettings({ status, appStatus, hotkey, onHotkeyChange }: GeneralSettingsProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  
  // We use a Set to track currently held keys for multi-key support (Ctrl+A+S)
  const heldKeys = useRef<Set<string>>(new Set())
  // We track the "max" combination seen during a press sequence to determine what to save
  const maxCombo = useRef<Set<string>>(new Set())
  
  // For display only
  const [displayKeys, setDisplayKeys] = useState<string[]>([])

  // Derive display status
  const isListening = status === 'Listening...'
  const isProcessing = status === 'Processing...' || status === 'Transcribing...'
  
  let micColorClass = "bg-blue-50 text-blue-500"
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

  const hotkeyParts = hotkey.split('+').map(k => k.trim())

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Normalize key name
    const rawKey = e.key.toLowerCase()
    const mappedKey = KEY_MAP[rawKey] || rawKey
    
    // Ignore if it's just a repeat
    if (e.repeat) return

    // Add to held keys
    heldKeys.current.add(mappedKey)
    
    // Update max combo if current is larger
    if (heldKeys.current.size > maxCombo.current.size) {
        maxCombo.current = new Set(heldKeys.current)
    } else if (JSON.stringify([...heldKeys.current].sort()) !== JSON.stringify([...maxCombo.current].sort())) {
        // Different combo of same size (rare but possible), prioritize most recent
        // Actually, usually we just want to track the "most keys pressed at once"
        // But if I press Ctrl (size 1) then release, then press Alt (size 1), 
        // maxCombo would stay Ctrl if we don't update.
        // Simple logic: Always update maxCombo to current if current is >= maxCombo
        // No, that overrides "Ctrl+A" with "A" if I release Ctrl.
        // We only grow maxCombo. Reset it on full release.
        maxCombo.current = new Set(heldKeys.current)
    }

    // Update display
    setDisplayKeys(Array.from(heldKeys.current))
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rawKey = e.key.toLowerCase()
    const mappedKey = KEY_MAP[rawKey] || rawKey
    
    // Remove from held keys
    heldKeys.current.delete(mappedKey)
    
    // Update display (optional, maybe we want to keep showing the combo until finished?)
    setDisplayKeys(Array.from(heldKeys.current))

    // If all keys are released, commit based on maxCombo
    if (heldKeys.current.size === 0) {
        const combo = Array.from(maxCombo.current)
        
        // Check if valid (at least 2 keys)
        if (combo.length >= 2) {
             // Soriting: Modifiers first, then alpha
             const modifiers = ['ctrl', 'shift', 'alt', 'windows', 'win']
             const sorted = combo.sort((a, b) => {
                 const aIsMod = modifiers.includes(a)
                 const bIsMod = modifiers.includes(b)
                 if (aIsMod && !bIsMod) return -1
                 if (!aIsMod && bIsMod) return 1
                 return 0
             })
             
             onHotkeyChange(sorted.join('+'))
             setIsCapturing(false)
        }
        
        // Reset
        maxCombo.current.clear()
        setDisplayKeys([])
    }
  }, [onHotkeyChange])

  useEffect(() => {
    if (isCapturing) {
      heldKeys.current.clear()
      maxCombo.current.clear()
      setDisplayKeys([])
      
      window.addEventListener('keydown', handleKeyDown, true)
      window.addEventListener('keyup', handleKeyUp, true)
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true)
        window.removeEventListener('keyup', handleKeyUp, true)
      }
    }
  }, [isCapturing, handleKeyDown, handleKeyUp])

  // Cancel capture on escape (if it's the ONLY key pressed)
  // Actually, we can't use Escape to cancel if we want to allow Escape in hotkeys.
  // But usually Escape is reserved. Let's keep it as cancel for now, unless it's part of a combo.
  // If user presses Ctrl+Esc, it opens Start menu usually.
  // Let's add a "Cancel" button in UI, and maybe if JUST Escape is pressed and released.

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
                      {displayKeys.length > 0 ? (
                        displayKeys.map((key, i) => (
                           <span key={i} className="flex items-center gap-1.5">
                              {i > 0 && <span className="text-blue-300 text-sm font-medium">+</span>}
                              <kbd className="min-w-[32px] h-7 px-2 flex items-center justify-center bg-white border border-blue-200 rounded text-blue-600 text-xs font-mono font-bold uppercase">
                                {key}
                              </kbd>
                           </span>
                        ))
                      ) : (
                         <span className="text-blue-500 text-sm font-medium">Listening for keys...</span>
                      )}
                    </div>
                    <button 
                      onClick={() => { setIsCapturing(false); setDisplayKeys([]) }}
                      className="text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      {hotkeyParts.map((key, i) => (
                         <span key={i} className="flex items-center gap-1.5">
                             {i > 0 && <span className="text-zinc-300 text-sm font-medium">+</span>}
                             <kbd className="min-w-[42px] h-8 px-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 border-b-2 rounded-lg text-zinc-500 text-xs font-mono font-bold shadow-sm capitalize">
                               {key}
                             </kbd>
                         </span>
                      ))}
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
