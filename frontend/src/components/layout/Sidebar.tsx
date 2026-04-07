import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Trophy, Users, Calendar,
  Flag, TrendingUp, Brain, ChevronRight, X,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/drivers', label: 'Pilotos', icon: Users },
  { to: '/constructors', label: 'Constructores', icon: Trophy },
  { to: '/calendar', label: 'Calendario', icon: Calendar },
  { to: '/pitstops', label: 'Análisis Pitstops', icon: TrendingUp },
  { to: '/predictions', label: 'Predicciones', icon: Brain },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-60 flex flex-col z-30 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#2e2e2e' }}>
          <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-sm"
            style={{ backgroundColor: '#e10600' }}>F1</div>
          <span className="font-bold text-base tracking-wide flex-1" style={{ color: '#f0f0f0' }}>
            F1 Dashboard
          </span>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded"
            style={{ color: '#8a8a8a' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'text-white'
                    : 'hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#e10600' : 'transparent',
                color: isActive ? '#fff' : '#8a8a8a',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 text-xs" style={{ color: '#8a8a8a', borderTop: '1px solid #2e2e2e' }}>
          <div className="flex items-center gap-2">
            <Flag size={12} />
            <span>Temporadas 2015–2025</span>
          </div>
        </div>
      </aside>
    </>
  )
}
