import { NavLink } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { LayoutDashboard, Rss, Server, GitBranch, ScrollText, Settings, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/subscriptions', icon: Rss, label: '订阅管理' },
  { to: '/nodes', icon: Server, label: '节点列表' },
  { to: '/policies', icon: GitBranch, label: '策略组' },
  { to: '/logs', icon: ScrollText, label: '日志' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore()

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-56'}`}
      style={{ backgroundColor: 'var(--panel-card)', borderRight: '1px solid var(--panel-border)' }}
    >
      <div className="flex items-center h-14 px-4 border-b shrink-0" style={{ borderColor: 'var(--panel-border)' }}>
        <Zap size={22} style={{ color: 'var(--panel-accent)' }} />
        {!sidebarCollapsed && <span className="ml-3 font-bold text-sm whitespace-nowrap" style={{ color: 'var(--panel-text)' }}>云端软路由</span>}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''} ${isActive ? 'font-medium' : ''}`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--panel-accent)' : 'transparent',
              color: isActive ? '#fff' : 'var(--panel-muted)',
            })}
          >
            <item.icon size={18} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--panel-border)' }}>
        <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 rounded-lg" style={{ color: 'var(--panel-muted)' }}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
