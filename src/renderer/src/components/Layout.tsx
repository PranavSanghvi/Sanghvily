import { ReactNode } from 'react'
import { TitleBar } from './TitleBar'

interface LayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export function Layout({ children, sidebar }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#f5f5f5] text-zinc-900 overflow-hidden font-sans selection:bg-blue-500/20">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
            {sidebar}
            <main className="flex-1 h-full overflow-y-auto bg-[#f5f5f5] relative rounded-tl-2xl border-t border-l border-white/50 shadow-inner">
                 {/* Soft gradient blob for premium feel */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
                
                <div className="relative z-10 p-8 h-full">
                    {children}
                </div>
            </main>
        </div>
    </div>
  )
}
