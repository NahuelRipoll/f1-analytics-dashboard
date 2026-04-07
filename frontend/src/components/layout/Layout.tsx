import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg"
          style={{ color: '#f0f0f0' }}
        >
          <Menu size={20} />
        </button>
        <div className="w-7 h-7 rounded flex items-center justify-center font-black text-white text-xs"
          style={{ backgroundColor: '#e10600' }}>F1</div>
        <span className="font-bold text-sm tracking-wide" style={{ color: '#f0f0f0' }}>
          F1 Dashboard
        </span>
      </div>

      <main className="flex-1 md:ml-60 overflow-auto pt-14 md:pt-0">
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
