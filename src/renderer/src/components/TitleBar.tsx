import { Minus, X, Square } from 'lucide-react'
import icon from '../assets/icon.png'

export function TitleBar() {
  const handleMinimize = () => {
    // @ts-ignore
    window.electron.ipcRenderer.send('minimize-window') 
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMaximize = () => {
     // @ts-ignore
     window.electron.ipcRenderer.send('maximize-window') 
  }

  const handleClose = () => {
    // @ts-ignore
    window.electron.ipcRenderer.send('close-window') 
  }

  return (
    <div className="h-9 bg-[#f5f5f5] flex items-center justify-between select-none app-drag-region sticky top-0 z-50 px-2 border-b border-black/5">
      <div className="px-2 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        <img src={icon} alt="App Icon" className="w-4 h-4" />
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Sanghvily</div>
      </div>
      <div className="flex h-full no-drag items-center gap-1">
        <button 
            onClick={handleMinimize}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-zinc-200 text-zinc-500 transition-colors"
        >
            <Minus size={16} />
        </button>
        {/* <button className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-zinc-200 text-zinc-500"><Square size={14} /></button> */}
        <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500 hover:text-white text-zinc-500 transition-colors"
        >
            <X size={16} />
        </button>
      </div>
    </div>
  )
}
