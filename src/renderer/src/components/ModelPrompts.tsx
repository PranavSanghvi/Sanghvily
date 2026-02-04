import { useState, useEffect, useRef } from 'react'

export function ModelPrompts() {
  const [contextText, setContextText] = useState(() => {
    return localStorage.getItem('model_context_text') || ''
  })
  
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem('model_context_enabled') === 'true'
  })

  const [isSaved, setIsSaved] = useState(true)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Persist State
  useEffect(() => {
    localStorage.setItem('model_context_text', contextText)
  }, [contextText])

  useEffect(() => {
    localStorage.setItem('model_context_enabled', isEnabled.toString())
  }, [isEnabled])

  // Sync to Backend
  // We sync when:
  // 1. isEnabled changes
  // 2. contextText changes (debounced) AND isEnabled is true
  
  const syncToBackend = (text: string, enabled: boolean) => {
     const payload = enabled ? text : null
     console.log("Syncing Context to Backend:", payload ? `"${payload.substring(0, 20)}..."` : "DISABLED")
     // @ts-ignore
     window.electron.ipcRenderer.send('set-active-prompt', { id: 'context', template: payload })
  }

  // Effect for Enable/Disable toggle
  useEffect(() => {
      syncToBackend(contextText, isEnabled)
  }, [isEnabled])

  // Effect for Text Change (Debounced)
  useEffect(() => {
      setIsSaved(false)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      
      debounceTimer.current = setTimeout(() => {
          if (isEnabled) {
              syncToBackend(contextText, true)
          }
          setIsSaved(true)
      }, 1000) // 1 second debounce

      return () => {
          if (debounceTimer.current) clearTimeout(debounceTimer.current)
      }
  }, [contextText])


  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-12">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Model Prompts</h2>
            <p className="text-zinc-500 text-sm mt-1">Add domain-specific vocabulary, names, or terms to improve accuracy.</p>
          </div>
      </div>

      <div className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
          isEnabled ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-zinc-200'
      }`}>
          
          {/* Header / Toggle Bar */}
          <div className={`px-6 py-4 flex items-center justify-between border-b ${
              isEnabled ? 'bg-blue-50/50 border-blue-100' : 'bg-zinc-50 border-zinc-100'
          }`}>
              <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-colors ${
                      isEnabled ? 'bg-blue-600 animate-pulse' : 'bg-zinc-300'
                  }`} />
                  <span className={`text-sm font-semibold tracking-wide uppercase ${
                      isEnabled ? 'text-blue-700' : 'text-zinc-500'
                  }`}>
                      {isEnabled ? 'Context Active' : 'Context Inactive'}
                  </span>
              </div>

              <button 
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isEnabled ? 'bg-blue-600 focus:ring-blue-600' : 'bg-zinc-200 focus:ring-zinc-400'
                  }`}
              >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
          </div>

          {/* Text Area */}
          <div className="p-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Vocabulary List
                  <span className="text-zinc-400 font-normal ml-2 text-xs">
                      (Comma separated list of names, acronyms, and terms)
                  </span>
              </label>
              <textarea 
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="e.g. Dr. Sanghvi, Echocardiogram, CVD, Sanghvily, Atrial Fibrillation..."
                  rows={8}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all font-mono text-sm resize-none ${
                      isEnabled 
                        ? 'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 text-zinc-900 bg-white' 
                        : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/10 text-zinc-500 bg-zinc-50/50'
                  }`}
              />
              
              <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                      Changes are saved automatically.
                  </p>
                  <div className={`text-xs font-medium transition-opacity duration-300 ${
                      isSaved ? 'opacity-100 text-green-600' : 'opacity-0'
                  }`}>
                      Saved
                  </div>
              </div>
          </div>
      </div>
    </div>
  )
}
