import { Sliders, History, Sparkles, Mic } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import logo from '../assets/icon.png' 

interface SidebarProps {
  currentTab: string
  onTabChange: (tab: string) => void
  appStatus: 'online' | 'offline' | 'error' | 'warning'
  onToggleStatus: () => void
}

export function Sidebar({ currentTab, onTabChange, appStatus, onToggleStatus }: SidebarProps) {
  const navItems = [
    { id: 'general', icon: Sliders, label: 'General Settings' },
    { id: 'models', icon: Mic, label: 'Dictation Models' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'prompts', icon: Sparkles, label: 'Model Prompts' },
  ]

  function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs))
  }

  return (
    <div className="w-64 h-full bg-[#f5f5f5] flex flex-col p-4">
      <div className="mb-8 px-2 flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img src={logo} alt="Sanghvily" className="w-full h-full object-contain" />
        </div>
        <div>
            <h1 className="text-lg font-bold text-zinc-900 leading-tight">
                Sanghvily
            </h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50" 
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50"
              )}
            >
              <Icon size={18} className={isActive ? "text-blue-600" : "text-zinc-400"} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto px-2 pb-4">
          <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider text-center">
              Developed by: Pranav Sanghvi
          </p>
      </div>

      {/* Status Toggle */}
      <div className="pt-4 border-t border-zinc-200">
        
        {/* Status Toggle Card */}
        <div 
            onClick={onToggleStatus}
            className="bg-white rounded-xl border border-zinc-200 p-3 shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors group"
        >
              <p className="text-[10px] font-semibold text-zinc-400 uppercase mb-1 group-hover:text-zinc-500">System Status</p>
              <div className="flex items-center gap-2">
                 <div className={cn(
                     "w-2.5 h-2.5 rounded-full transition-all duration-300",
                     appStatus === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" :
                     appStatus === 'error' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" :
                     appStatus === 'warning' ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse" :
                     "bg-zinc-400"
                 )}></div>
                 <div className="flex-1">
                    <span className="text-xs font-medium text-zinc-700 block">
                        {
                          appStatus === 'online' ? 'Online' : 
                          appStatus === 'error' ? 'Error' : 
                          appStatus === 'warning' ? 'Check Key' :
                          'Offline'
                        }
                    </span>
                 </div>
                 <div className="text-[10px] text-zinc-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {appStatus === 'offline' ? 'ENABLE' : 'DISABLE'}
                 </div>
              </div>
          </div>
      </div>
    </div>
  )
}
