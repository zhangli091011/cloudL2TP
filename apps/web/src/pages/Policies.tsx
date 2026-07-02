import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { GitBranch, Check, ChevronDown } from 'lucide-react'

const typeLabels: Record<string, string> = { 'URLTest': '自动测速', 'Selector': '手动选择', 'Fallback': '故障转移', 'LoadBalance': '负载均衡', 'Relay': '链式代理' }
const typeBadge: Record<string, string> = { 'URLTest': 'badge-info', 'Selector': 'badge-success', 'Fallback': 'badge-warning', 'LoadBalance': 'badge-info', 'Relay': 'badge-info' }

export default function Policies() {
  const { proxyGroups, loadingProxyGroups, fetchProxyGroups, switchProxyNode } = useStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { fetchProxyGroups() }, [fetchProxyGroups])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>策略组</h2>
        <button onClick={fetchProxyGroups} className="btn-secondary btn-sm">刷新</button>
      </div>

      {loadingProxyGroups ? (
        <div className="card text-center py-12" style={{ color: 'var(--panel-muted)' }}>加载中...</div>
      ) : proxyGroups.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--panel-muted)' }}>暂无策略组数据，请确认 Mihomo 正在运行</div>
      ) : (
        <div className="space-y-3">
          {proxyGroups.map(group => (
            <div key={group.name} className="card">
              <button onClick={() => setExpanded(expanded === group.name ? null : group.name)} className="w-full flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <GitBranch size={16} style={{ color: 'var(--panel-accent)' }} />
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>{group.name}</h3>
                    <p className="text-xs mt-0.5 truncate max-w-[250px]" style={{ color: 'var(--panel-muted)' }}>{group.now}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${typeBadge[group.type] || 'badge-info'}`}>{typeLabels[group.type] || group.type}</span>
                  <span className="text-xs" style={{ color: 'var(--panel-muted)' }}>{group.all.length} 个</span>
                  <ChevronDown size={16} style={{ color: 'var(--panel-muted)', transform: expanded === group.name ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>
              </button>

              {expanded === group.name && (
                <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid var(--panel-border)' }}>
                  {group.all.map(nodeName => {
                    const isActive = nodeName === group.now
                    return (
                      <button key={nodeName}
                        onClick={() => switchProxyNode(group.name, nodeName)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                        style={{ backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : 'transparent', color: isActive ? 'var(--panel-accent)' : 'var(--panel-text)' }}
                      >
                        <span className="text-left truncate">{nodeName}</span>
                        {isActive && <Check size={15} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
