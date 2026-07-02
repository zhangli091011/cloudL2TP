import { useStore } from '../store/useStore'
import { Moon, Sun, LogOut, User } from 'lucide-react'

export default function Header() {
  const { theme, toggleTheme, user, logout } = useStore()
  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--panel-card)', borderBottom: '1px solid var(--panel-border)' }}>
      <h1 className="text-sm font-medium" style={{ color: 'var(--panel-muted)' }}>控制面板</h1>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--panel-muted)' }} title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--panel-border)' }}>
          <User size={15} style={{ color: 'var(--panel-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--panel-text)' }}>{user?.username || 'admin'}</span>
        </div>
        <button onClick={logout} className="p-2 rounded-lg" style={{ color: 'var(--panel-muted)' }} title="退出登录">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
