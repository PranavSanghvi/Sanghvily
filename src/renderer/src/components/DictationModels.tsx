import { Key, Sparkles, Zap, CheckCircle2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface DictationModelsProps {
  apiKey: string
  setApiKey: (key: string) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  saveKey: () => void
  appStatus: 'online' | 'offline' | 'error' | 'warning'
}

export function DictationModels({ apiKey, setApiKey, selectedModel, setSelectedModel, saveKey, appStatus }: DictationModelsProps) {
  
  const models = [
      {
          id: 'whisper-large-v3-turbo',
          name: 'Whisper Large v3 Turbo',
          desc: 'Fastest inference, optimized for speed.',
          icon: Zap
      },
      {
          id: 'whisper-large-v3',
          name: 'Whisper Large v3',
          desc: 'Highest accuracy, standard Groq model.',
          icon: Sparkles
      }
  ]

  function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-6">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">Dictation Models</h2>
      
      {appStatus === 'warning' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2 bg-yellow-100/50 rounded-lg text-yellow-600">
                  <AlertTriangle size={20} />
              </div>
              <div>
                  <h3 className="font-medium text-yellow-900">API Key Required</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                      Your Groq API key is missing or invalid. Please update it below to continue using Sanghvily.
                  </p>
              </div>
          </div>
      )}

      {/* API Key Config */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Authentication</h3>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 font-medium">
                    <Key size={18} />
                    <h3>Groq API Key</h3>
                </div>
                {apiKey && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium animate-in fade-in slide-in-from-left-2">
                        <CheckCircle2 size={12} />
                        <span>Saved</span>
                    </div>
                )}
            </div>
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <input 
                        type="password" 
                        placeholder={apiKey ? "••••••••••••••••••••••••" : "gsk_..."}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className={clsx(
                            "w-full bg-zinc-50 border rounded-lg px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all placeholder:text-zinc-400",
                            apiKey 
                                ? "border-green-200 focus:border-green-500 focus:ring-green-500/20" 
                                : "border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20"
                        )}
                    />
                </div>
                <button 
                    onClick={saveKey}
                    disabled={!apiKey}
                    className="px-6 py-2.5 bg-zinc-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-zinc-900/10"
                >
                    Save
                </button>
            </div>
            <p className="text-xs text-zinc-400">
                Your API key is stored securely on your local device.
            </p>
        </div>
      </section>

      {/* Model Selection */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Groq Model Selection</h3>
        <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100 shadow-sm overflow-hidden">
            {models.map((model) => {
                const isSelected = selectedModel === model.id
                return (
                    <div 
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={cn(
                            "p-4 flex items-center justify-between transition-colors cursor-pointer",
                            isSelected ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-zinc-50"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isSelected ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500"
                            )}>
                                <model.icon size={20} />
                            </div>
                            <div>
                                <p className={cn("font-medium transition-colors", isSelected ? "text-blue-900" : "text-zinc-900")}>
                                    {model.name}
                                </p>
                                <p className="text-xs text-zinc-500">{model.desc}</p>
                            </div>
                        </div>
                        
                        <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-transparent"
                        )}>
                            {isSelected && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                    </div>
                )
            })}
        </div>
      </section>
    </div>
  )
}
