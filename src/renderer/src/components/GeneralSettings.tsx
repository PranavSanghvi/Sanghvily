import { Keyboard, Mic } from 'lucide-react'

interface GeneralSettingsProps {
  status: string
  appStatus: 'online' | 'offline' | 'error' | 'warning'
}

export function GeneralSettings({ status, appStatus }: GeneralSettingsProps) {
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
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 shadow-sm">
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
                <div className="flex items-center gap-1.5">
                    <kbd className="min-w-[42px] h-8 px-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 border-b-2 rounded-lg text-zinc-500 text-xs font-mono font-bold shadow-sm transition-transform active:translate-y-0.5 active:border-b active:shadow-none" title="Control">
                        Ctrl
                    </kbd>
                    <span className="text-zinc-300 text-sm font-medium">+</span>
                    <kbd className="min-w-[42px] h-8 px-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 border-b-2 rounded-lg text-zinc-500 text-xs font-mono font-bold shadow-sm transition-transform active:translate-y-0.5 active:border-b active:shadow-none" title="Shift">
                        Shift
                    </kbd>
                    <span className="text-zinc-300 text-sm font-medium">+</span>
                    <kbd className="min-w-[48px] h-8 px-2 flex items-center justify-center bg-zinc-50 border border-zinc-200 border-b-2 rounded-lg text-zinc-500 text-xs font-mono font-bold shadow-sm transition-transform active:translate-y-0.5 active:border-b active:shadow-none" title="Space">
                        Space
                    </kbd>
                </div>
            </div>
        </div>
      </section>
      
    </div>
  )
}
