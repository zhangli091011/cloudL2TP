import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Activity, Server, GitBranch, Clock, Download, Upload, Gauge, Shield } from 'lucide-react'

function formatSpeed(bps: number): string {
  if (bps >= 1048576) return (bps / 1048576).toFixed(1) + ' MB/s'
  if (bps >= 1024) return (bps / 1024).toFixed(1) + ' KB/s'
  return bps + ' B/s'
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

export default function Dashboard() {
  const { dashboard, loadingDashboard, fetchDashboard, fetchNodes } = useStore()

  useEffect(() => {
    fetchDashboard()
    fetchNodes()
  }, [fetchDashboard, fetchNodes])

  const ms = dashboard?.mihomoStatus

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>仪表盘</h2>

      {loadingDashboard ? (
        <div className="card text-center py-12" style={{ color: 'var(--panel-muted)' }}>加载中...</div>
      ) : dashboard ? (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} style={{ color: 'var(--panel-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>Mihomo 状态</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ms?.running ? 'var(--panel-success)' : 'var(--panel-danger)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>{ms?.running ? '运行中' : '已停止'}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>{ms?.version || 'unknown'}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} style={{ color: 'var(--panel-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>当前出口节点</span>
              </div>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--panel-text)' }}>{dashboard.currentNode || '无'}</p>
              {dashboard.currentNodeLatency && (
                <p className="text-xs mt-1" style={{ color: 'var(--panel-success)' }}>{dashboard.currentNodeLatency}ms</p>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={16} style={{ color: 'var(--panel-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>当前策略组</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>{dashboard.currentProxyGroup}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>模式: {ms?.mode || 'rule'}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} style={{ color: 'var(--panel-accent)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>订阅 / 节点</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>
                {dashboard.subscriptionCount} 订阅 / {dashboard.nodeCount} 节点
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>
                {dashboard.lastSubscriptionUpdate ? new Date(dashboard.lastSubscriptionUpdate).toLocaleString('zh-CN') : '未更新'}
              </p>
            </div>
          </div>

          {/* Traffic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><Gauge size={16} style={{ color: 'var(--panel-warning)' }} /><span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>连接数</span></div>
              <p className="text-2xl font-bold" style={{ color: 'var(--panel-text)' }}>{ms?.connections || 0}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><Upload size={16} style={{ color: 'var(--panel-info)' }} /><span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>上传速度</span></div>
              <p className="text-2xl font-bold" style={{ color: 'var(--panel-text)' }}>{formatSpeed(ms?.uploadSpeed || 0)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>总计: {formatBytes(ms?.uploadTotal || 0)}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-3"><Download size={16} style={{ color: 'var(--panel-success)' }} /><span className="text-xs font-medium" style={{ color: 'var(--panel-muted)' }}>下载速度</span></div>
              <p className="text-2xl font-bold" style={{ color: 'var(--panel-text)' }}>{formatSpeed(ms?.downloadSpeed || 0)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>总计: {formatBytes(ms?.downloadTotal || 0)}</p>
            </div>
          </div>

          {/* VPN Hint */}
          <div className="card">
            <div className="flex items-start gap-2">
              <Shield size={16} style={{ color: 'var(--panel-info)' }} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--panel-text)' }}>VPN 接入提示</p>
                <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>{dashboard.vpnHint}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>
                  旧路由器配置: VPN 类型 = L2TP/IPsec，服务器地址 = 本服务器公网 IP，详见 README
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12" style={{ color: 'var(--panel-muted)' }}>无法获取仪表盘数据，请检查 API 服务</div>
      )}
    </div>
  )
}
