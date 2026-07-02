import { useState } from 'react'
import { Server, Shield, Clock, Info, KeyRound, Loader } from 'lucide-react'
import { api } from '../api'

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChangePassword = async () => {
    setMessage('')
    setError('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写完整密码信息')
      return
    }

    if (newPassword.length < 8) {
      setError('新密码至少需要 8 位')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    setSaving(true)
    try {
      await api.changePassword({ oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('密码已修改')
    } catch (err: any) {
      setError(err.response?.data?.error || '修改密码失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>设置</h2>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} style={{ color: 'var(--panel-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>系统信息</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span style={{ color: 'var(--panel-muted)' }}>API 版本</span><span style={{ color: 'var(--panel-text)' }}>v1.0.0</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--panel-muted)' }}>数据库</span><span style={{ color: 'var(--panel-text)' }}>SQLite</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--panel-muted)' }}>代理核心</span><span style={{ color: 'var(--panel-text)' }}>Mihomo</span></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} style={{ color: 'var(--panel-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>修改密码</h3>
        </div>
        <div className="space-y-3">
          <input
            className="input-field w-full"
            type="password"
            autoComplete="current-password"
            placeholder="旧密码"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />
          <input
            className="input-field w-full"
            type="password"
            autoComplete="new-password"
            placeholder="新密码"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <input
            className="input-field w-full"
            type="password"
            autoComplete="new-password"
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          {error && <p className="text-xs" style={{ color: 'var(--panel-danger)' }}>{error}</p>}
          {message && <p className="text-xs" style={{ color: 'var(--panel-success)' }}>{message}</p>}
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="btn-primary btn-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader size={14} className="animate-spin" />}
            保存新密码
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: 'var(--panel-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>安全提示</h3>
        </div>
        <div className="space-y-2 text-sm" style={{ color: 'var(--panel-muted)' }}>
          <div className="flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--panel-warning)' }} />
            <span>Mihomo API Secret 存储在服务端环境变量中，不会暴露到前端</span>
          </div>
          <div className="flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--panel-warning)' }} />
            <span>订阅 URL 在数据库中使用 AES-256-GCM 加密存储</span>
          </div>
          <div className="flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--panel-warning)' }} />
            <span>前端显示订阅链接时已自动脱敏，隐藏 token 参数</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: 'var(--panel-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>配置说明</h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--panel-muted)' }}>
          所有配置项通过 <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--panel-bg)' }}>.env</code> 文件或环境变量设置，
          包括 Mihomo API 地址、JWT 密钥、订阅更新间隔等。详细说明请参阅项目 README.md。
        </p>
      </div>
    </div>
  )
}
