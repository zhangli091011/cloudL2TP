import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Trash2, Search } from 'lucide-react'

export default function Logs() {
  const { logs, logTotal, loadingLogs, fetchLogs, clearLogs } = useStore()
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const levelBadge: Record<string, string> = { info: 'badge-info', warn: 'badge-warning', error: 'badge-error', debug: '' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>日志</h2>
        <button onClick={async () => { await clearLogs(); fetchLogs() }} className="btn-danger btn-sm flex items-center gap-1.5"><Trash2 size={14} /> 清空日志</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--panel-muted)' }} />
          <input className="input-field pl-9 w-56" placeholder="搜索日志..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map(level => (
            <button key={level} onClick={() => { setFilter(level); fetchLogs({ level: level === 'all' ? undefined : level, search: search || undefined }) }}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{ backgroundColor: filter === level ? 'var(--panel-accent)' : 'var(--panel-card)', color: filter === level ? '#fff' : 'var(--panel-muted)', border: filter === level ? 'none' : '1px solid var(--panel-border)' }}>
              {level === 'all' ? '全部' : level.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-260px)]">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 text-sm font-mono hover:bg-[var(--panel-bg)]" style={{ borderBottom: '1px solid var(--panel-border)' }}>
              <span className="text-xs shrink-0 w-16 mt-0.5" style={{ color: 'var(--panel-muted)' }}>{new Date(log.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className={`badge !text-[10px] shrink-0 mt-0.5 ${levelBadge[log.level] || ''}`} style={log.level === 'debug' ? { color: 'var(--panel-muted)', backgroundColor: 'var(--panel-border)' } : {}}>
                {log.level.toUpperCase()}
              </span>
              <span className="flex-1 break-all" style={{ color: 'var(--panel-text)' }}>{log.message}</span>
            </div>
          ))}
        </div>
        {logs.length === 0 && <div className="py-12 text-center text-sm" style={{ color: 'var(--panel-muted)' }}>暂无日志</div>}
      </div>
      <div className="text-xs" style={{ color: 'var(--panel-muted)' }}>共 {logTotal} 条日志</div>
    </div>
  )
}
