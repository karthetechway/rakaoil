import { useState, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { fetchStockEntries, addStockEntry } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { format } from 'date-fns'

export default function Stock() {
  const { products, loading: productsLoading } = useProducts({ showAll: true })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ quantity: '', remarks: '', type: 'in' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const loadEntries = async (productId) => {
    setLoadingEntries(true)
    try {
      const data = await fetchStockEntries(productId)
      setEntries(data)
    } catch (e) {
      toast(e.message, 'error')
    }
    setLoadingEntries(false)
  }

  useEffect(() => {
    if (selectedProduct) {
      loadEntries(selectedProduct.id)
    } else {
      setEntries([])
    }
  }, [selectedProduct])

  const handleAddStock = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      return toast('Please enter a valid quantity', 'error')
    }

    setSaving(true)
    try {
      await addStockEntry({
        product_id: selectedProduct.id,
        quantity: form.quantity,
        type: form.type,
        remarks: form.remarks
      })
      toast('Stock entry added!')
      setForm({ quantity: '', remarks: '', type: 'in' })
      setShowAddForm(false)
      loadEntries(selectedProduct.id)
    } catch (e) {
      toast(e.message, 'error')
    }
    setSaving(false)
  }

  if (productsLoading) return <div className="page">Loading products...</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Stock Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Track and manage your inventory levels</p>
      </div>

      <div className="stock-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 160px)' }}>
        {/* Left: Product List */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, color: 'var(--brown-dark)' }}>Products</h3>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {products.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProduct(p)}
                style={{ 
                  padding: '1rem', 
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: selectedProduct?.id === p.id ? 'var(--cream)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.size} {p.unit} ({p.category})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: History & Add Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!selectedProduct ? (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
                <p>Select a product to view stock history</p>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedProduct.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Stock history for {selectedProduct.size} pack</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? 'Cancel' : '+ Add Stock Entry'}
                </button>
              </div>

              {showAddForm && (
                <div className="card" style={{ borderColor: 'var(--gold)', borderWidth: 1.5 }}>
                  <form onSubmit={handleAddStock}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12 }}>
                      <div>
                        <label>Entry Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                          <option value="in">Restock (+)</option>
                          <option value="out">Adjustment (-)</option>
                        </select>
                      </div>
                      <div>
                        <label>Quantity</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          placeholder="e.g. 50" 
                          value={form.quantity} 
                          onChange={e => setForm({ ...form, quantity: e.target.value })} 
                          autoFocus
                        />
                      </div>
                      <div>
                        <label>Remarks</label>
                        <input 
                          type="text" 
                          placeholder="e.g. New harvest batch" 
                          value={form.remarks} 
                          onChange={e => setForm({ ...form, remarks: e.target.value })} 
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Stock Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--cream-light)' }}>
                  <h4 style={{ margin: 0, fontSize: 14 }}>Entries Overview</h4>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {loadingEntries ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
                  ) : entries.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No stock entries yet for this product.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--white)', boxShadow: '0 1px 0 var(--border)' }}>
                        <tr style={{ textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px 16px' }}>Date</th>
                          <th style={{ padding: '12px 16px' }}>Type</th>
                          <th style={{ padding: '12px 16px' }}>Quantity</th>
                          <th style={{ padding: '12px 16px' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                            <td style={{ padding: '12px 16px' }}>{format(new Date(entry.created_at), 'dd MMM yyyy, hh:mm a')}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span className={`badge ${entry.type === 'in' ? 'badge-success' : 'badge-danger'}`} style={{ 
                                background: entry.type === 'in' ? '#e8f5ec' : '#fdecee',
                                color: entry.type === 'in' ? '#3a7d51' : '#b91c1c'
                              }}>
                                {entry.type === 'in' ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                              {entry.type === 'in' ? '+' : '-'}{entry.quantity}
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{entry.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
