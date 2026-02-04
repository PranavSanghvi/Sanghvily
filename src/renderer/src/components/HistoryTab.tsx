import { FileText, Clock, Search, Trash2, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Power, Eraser } from 'lucide-react'
import { useState } from 'react'

interface HistoryItem {
    id: string
    text: string
    time: string
    model: string
}

interface HistoryTabProps {
    history: HistoryItem[]
    onDelete: (id: string) => void
    onClear: () => void
    isEnabled: boolean
    onToggleEnabled: () => void
}

export function HistoryTab({ history, onDelete, onClear, isEnabled, onToggleEnabled }: HistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredHistory = history.filter(item => 
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopy = (text: string, id: string) => {
      navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleExpand = (id: string) => {
      setExpandedId(prev => prev === id ? null : id)
  }

  // Format timestamp to relative time (simplified)
  const formatTime = (isoString: string) => {
      const date = new Date(isoString)
      const now = new Date()
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
      return date.toLocaleDateString()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-6 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900">History</h2>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={onToggleEnabled}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isEnabled 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                    }`}
                >
                    <Power size={14} />
                    {isEnabled ? 'Saving Enabled' : 'Saving Paused'}
                </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search history..." 
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                />
            </div>
            {history.length > 0 && (
                <button 
                    onClick={onClear}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                    title="Clear All History"
                >
                    <Eraser size={18} />
                </button>
            )}
          </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-white border border-zinc-100 rounded-xl">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-300">
                    <AlertCircle size={24} />
                </div>
                <p className="text-zinc-500 text-sm">No history found</p>
            </div>
        ) : (
            filteredHistory.map((item) => (
                <div 
                    key={item.id} 
                    className={`group bg-white border hover:border-blue-300 hover:shadow-md rounded-xl p-4 transition-all cursor-pointer ${
                        expandedId === item.id ? 'border-blue-200 ring-4 ring-blue-50/50' : 'border-zinc-200'
                    }`}
                    onClick={() => toggleExpand(item.id)}
                >
                    <div className="flex items-start gap-4">
                        <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            expandedId === item.id ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                        }`}>
                            <FileText size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                    <Clock size={12} />
                                    <span>{formatTime(item.time)}</span>
                                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                                    <span className="font-mono">{item.model.replace('whisper-', '').replace('-turbo', ' (Turbo)')}</span>
                                </div>
                                
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={() => handleCopy(item.text, item.id)}
                                        className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Copy Text"
                                    >
                                        {copiedId === item.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => onDelete(item.id)}
                                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <p className={`text-zinc-800 text-sm leading-relaxed transition-all ${
                                expandedId === item.id ? '' : 'line-clamp-2'
                            }`}>
                                {item.text}
                            </p>
                            
                            {expandedId === item.id && (
                                <div className="mt-2 pt-2 flex justify-center border-t border-zinc-100">
                                    <ChevronUp size={16} className="text-zinc-300" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
