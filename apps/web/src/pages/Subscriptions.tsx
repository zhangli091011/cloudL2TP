import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Trash2, RefreshCw, Edit, X, Check } from 'lucide-react'

export default function Subscriptions() {
  const { subscriptions, loadingSubscriptions, fetchSubscriptions, addSubscription, deleteSubscription, refreshSubscription, editSubscription } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', url: '' })
  const [editForm, setEditForm] = useState({ name: '', url: '', enabled: true })

  useEffect(() => { fetchSubscriptions() }, [fetchSubscriptions])

  const handleAdd = () => {
    if (!form.name || !form.url) return
    addSubscription(form)
    setForm({ name: '', url: '' })
    setShowAdd(false)
  }

  const startEdit = (sub: any) => {
    setEditingId(sub.id)
    setEditForm({ name: sub.name, url: '', enabled: sub.enabled })
  }

  const handleEdit = (id: number) => {
    editSubscription(id, { name: editForm.name, ...(editForm.url ? { url: editForm.url } : {}), enabled: editForm.enabled })
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--panel-text)' }}>订阅管理</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary btn-sm flex items-center gap-1"><Plus size={15} /> 添加订阅</button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>新增订阅</h3>
            <button onClick={() => setShowAdd(false)} style={{ color: 'var(--panel-muted)' }}><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-field" placeholder="订阅名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="input-field" placeholder="订阅链接 URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            <button onClick={handleAdd} className="btn-primary btn-sm">添加</button>
          </div>
        </div>
      )}

      {/* Sub List */}
      <div className="space-y-3">
        {subscriptions.map(sub => (
          <div key={sub.id} className="card">
            {editingId === sub.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="input-field" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="名称" />
                  <input className="input-field" value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="新 URL（留空不修改）" />
                  <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--panel-muted)' }}>
                    <input type="checkbox" checked={editForm.enabled} onChange={e => setEditForm(f => ({ ...f, enabled: e.target.checked }))} className="rounded" />启用
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(sub.id)} className="btn-primary btn-sm flex items-center gap-1"><Check size={14} /> 保存</button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary btn-sm">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--panel-text)' }}>{sub.name}</h3>
                    <span className={`badge ${sub.enabled ? 'badge-success' : 'badge-error'}`}>{sub.enabled ? '启用' : '停用'}</span>
                    {sub.lastError && <span className="badge badge-warning">上次错误</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--panel-muted)' }}>{sub.urlMasked}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--panel-muted)' }}>
                    节点数: {sub.nodeCount} · 更新: {sub.lastUpdatedAt ? new Date(sub.lastUpdatedAt).toLocaleString('zh-CN') : '从未'}
                  </p>
                  {sub.lastError && <p className="text-xs mt-0.5" style={{ color: 'var(--panel-danger)' }}>错误: {sub.lastError}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => refreshSubscription(sub.id)} className="btn-secondary btn-sm flex items-center gap-1"><RefreshCw size={14} /> 更新</button>
                  <button onClick={() => startEdit(sub)} className="btn-secondary btn-sm"><Edit size={14} /></button>
                  <button onClick={() => deleteSubscription(sub.id)} className="btn-danger btn-sm"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {subscriptions.length === 0 && <div className="card text-center py-10" style={{ color: 'var(--panel-muted)' }}>暂无订阅，点击右上角添加</div>}
      </div>
    </div>
  )
}
