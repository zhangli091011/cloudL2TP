import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useStore(s => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('请输入用户名和密码'); return }
    setLoading(true)
    setError('')
    const ok = await login(username, password)
    setLoading(false)
    if (!ok) setError('登录失败，用户名或密码错误')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--panel-bg)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ backgroundColor: 'var(--panel-card)', border: '1px solid var(--panel-border)' }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--panel-accent)' }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--panel-text)' }}>云端软路由</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--panel-muted)' }}>节点切换控制面板</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--panel-muted)' }}>用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" placeholder="请输入用户名" />
          </div>
          <div className="relative">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--panel-muted)' }}>密码</label>
            <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="请输入密码" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-[34px]" style={{ color: 'var(--panel-muted)' }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-xs" style={{ color: 'var(--panel-danger)' }}>{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
        </form>
        <p className="text-xs text-center mt-6" style={{ color: 'var(--panel-muted)' }}>默认账号: admin / admin123</p>
      </div>
    </div>
  )
}
