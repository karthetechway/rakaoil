import { useState, useEffect, useMemo } from 'react'
import { useProducts } from '../hooks/useProducts'
import { 
  fetchStockEntries, 
  addStockEntry, 
  updateStockEntry, 
  deleteStockEntry, 
  fetchProductSales,
  addProduct
} from '../lib/supabase'
import { useToast } from '../components/Toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subDays } from 'date-fns'

const CATEGORIES = ['Oils', 'Ghee', 'Dal & Sugar']
const UNITS      = ['ml', 'L', 'g', 'Kg']
const EMPTY_PROD = { name: '', name_tamil: '', category: 'Oils', size: '', unit: 'ml', price: '', gst_percent: 0 }

export default function Stock() {
  const { products, loading: productsLoading, reload: reloadProducts } = useProducts({ showAll: true })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [entries, setEntries] = useState([])
  const [sales, setSales] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  
  // Modals / Forms
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null) // null for new
  const [entryForm, setEntryForm] = useState({ quantity: '', remarks: '', type: 'in', date: format(new Date(), 'yyyy-MM-dd') })
  
  const [showProductModal, setShowProductModal] = useState(false)
  const [productForm, setProductForm] = useState(EMPTY_PROD)
  
  const [activeTab, setActiveTab] = useState('history') // 'history' or 'report'
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // ── Data Loading ───────────────────────────────────────────
  const loadData = async (productId) => {
    setLoadingEntries(true)
    try {
      const [entriesData, salesData] = await Promise.all([
        fetchStockEntries(productId),
        fetchProductSales(productId)
      ])
      setEntries(entriesData)
      setSales(salesData)
    } catch (e) {
      toast(e.message, 'error')
    }
    setLoadingEntries(false)
  }

  useEffect(() => {
    if (selectedProduct) {
      loadData(selectedProduct.id)
    }
  }, [selectedProduct])

  // ── Calculations ───────────────────────────────────────────
  const stats = useMemo(() => {
    const totalIn = entries.filter(e => e.type === 'in').reduce((s, e) => s + Number(e.quantity), 0)
    const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + Number(e.quantity), 0)
    const totalSales = sales.reduce((s, sl) => s + Number(sl.quantity), 0)
    return {
      totalIn,
      totalOut,
      totalSales,
      balance: totalIn - totalOut - totalSales
    }
  }, [entries, sales])

  // ── Handlers ───────────────────────────────────────────────
  const handleSaveEntry = async (e) => {
    e.preventDefault()
    if (!selectedProduct) return
    if (!entryForm.quantity || parseFloat(entryForm.quantity) <= 0) return toast('Valid quantity required', 'error')

    setSaving(true)
    try {
      if (editingEntry) {
        await updateStockEntry(editingEntry.id, {
          quantity: entryForm.quantity,
          type: entryForm.type,
          remarks: entryForm.remarks,
          created_at: entryForm.date
        })
        toast('Entry updated')
      } else {
        await addStockEntry({
          product_id: selectedProduct.id,
          quantity: entryForm.quantity,
          type: entryForm.type,
          remarks: entryForm.remarks,
          date: entryForm.date
        })
        toast('Entry added')
      }
      setShowEntryModal(false)
      loadData(selectedProduct.id)
    } catch (e) {
      toast(e.message, 'error')
    }
    setSaving(false)
  }

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this stock record?')) return
    try {
       await deleteStockEntry(id)
       toast('Entry deleted')
       loadData(selectedProduct.id)
    } catch (e) { toast(e.message, 'error') }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const newProd = await addProduct(productForm)
      toast(`Product "${newProd.name}" added`)
      setShowProductModal(false)
      setProductForm(EMPTY_PROD)
      reloadProducts()
    } catch (e) { toast(e.message, 'error') }
    setSaving(false)
  }

  const openEditEntry = (entry) => {
    setEditingEntry(entry)
    setEntryForm({
      quantity: entry.quantity,
      remarks: entry.remarks || '',
      type: entry.type,
      date: format(new Date(entry.created_at), 'yyyy-MM-dd')
    })
    setShowEntryModal(true)
  }

  const openNewEntry = () => {
    setEditingEntry(null)
    setEntryForm({ quantity: '', remarks: '', type: 'in', date: format(new Date(), 'yyyy-MM-dd') })
    setShowEntryModal(true)
  }

  if (productsLoading) return <div className="page">Loading products...</div>

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Stock Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>In-house inventory control & analysis</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowProductModal(true)}>+ New Product</button>
      </div>

      <div className="stock-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '1.5rem', height: 'calc(100vh - 160px)' }}>
        {/* Sidebar Product List */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--cream-light)' }}>
             <input placeholder="Search products..." style={{ fontSize: 13, padding: '6px 10px' }} />
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                    <div style={{ fontWeight: '600', fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.size} {p.category}</div>
                </div>
                {/* Stock Indicator could go here */}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!selectedProduct ? (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
                <p>Select a product to see stock data</p>
              </div>
            </div>
          ) : (
            <>
              {/* Product Summary Header */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 20 }}>{selectedProduct.name}</h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{selectedProduct.size} {selectedProduct.unit} pack</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                         <button className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('history')}>Movement</button>
                         <button className={`btn btn-sm ${activeTab === 'report' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('report')}>Analysis</button>
                    </div>
                </div>

                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-label">Stock In</div>
                        <div className="stat-val" style={{ color: '#059669' }}>+{stats.totalIn}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-label">Stock Out</div>
                        <div className="stat-val" style={{ color: '#dc2626' }}>-{stats.totalOut}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-label">Bill Sales</div>
                        <div className="stat-val" style={{ color: '#d97706' }}>-{stats.totalSales}</div>
                    </div>
                    <div className="stat-card" style={{ padding: '12px', background: 'var(--brown-dark)', color: 'white' }}>
                        <div className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Current Balance</div>
                        <div className="stat-val" style={{ color: 'white' }}>{stats.balance}</div>
                    </div>
                </div>
              </div>

              {activeTab === 'history' ? (
                <div className="card" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>Movement History</h4>
                    <button className="btn btn-primary btn-sm" onClick={openNewEntry}>+ Add Record</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: 'var(--cream-light)', fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        <tr>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Qty</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left' }}>Remarks</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No records found</td></tr>
                        ) : entries.map(e => (
                          <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px' }}>{format(new Date(e.created_at), 'dd/MM/yyyy')}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span className={`badge ${e.type === 'in' ? 'badge-success' : 'badge-danger'}`} style={{ color: e.type === 'in' ? '#065f46' : '#991b1b', background: e.type === 'in' ? '#dcfce7' : '#fee2e2' }}>
                                    {e.type.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 600 }}>{e.quantity}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>{e.remarks || '—'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <button className="btn-icon" onClick={() => openEditEntry(e)}>✎</button>
                                <button className="btn-icon" style={{ marginLeft: 8 }} onClick={() => handleDeleteEntry(e.id)}>🗑</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <StockReportSection entries={entries} sales={sales} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Entry Modal */}
      {showEntryModal && (
        <div className="cart-drawer-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, margin: '0 1rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingEntry ? 'Edit Stock Record' : 'Add Stock Record'}</h3>
            <form onSubmit={handleSaveEntry}>
                <div style={{ marginBottom: 15 }}>
                    <label>Record Date</label>
                    <input type="date" value={entryForm.date} onChange={e => setEntryForm({...entryForm, date: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                    <div>
                        <label>Type</label>
                        <select value={entryForm.type} onChange={e => setEntryForm({...entryForm, type: e.target.value})}>
                            <option value="in">Stock In (+)</option>
                            <option value="out">Adjustment Out (-)</option>
                        </select>
                    </div>
                    <div>
                        <label>Quantity</label>
                        <input type="number" step="0.01" value={entryForm.quantity} onChange={e => setEntryForm({...entryForm, quantity: e.target.value})} required />
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                     <label>Remarks</label>
                     <input placeholder="Optional notes..." value={entryForm.remarks} onChange={e => setEntryForm({...entryForm, remarks: e.target.value})} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowEntryModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : (editingEntry ? 'Update' : 'Add Record')}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="cart-drawer-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, margin: '0 1rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                        <label>Name (English)</label>
                        <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required placeholder="e.g. Sesame Oil" />
                    </div>
                    <div>
                        <label>Tamil Name</label>
                        <input value={productForm.name_tamil} onChange={e => setProductForm({...productForm, name_tamil: e.target.value})} placeholder="எள்ளெண்ணெய்" />
                    </div>
                    <div>
                        <label>Category</label>
                        <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Size</label>
                        <input value={productForm.size} onChange={e => setProductForm({...productForm, size: e.target.value})} required placeholder="e.g. 1L, 500g" />
                    </div>
                    <div>
                        <label>Price (₹)</label>
                        <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
                    </div>
                    <div>
                        <label>GST %</label>
                        <input type="number" value={productForm.gst_percent} onChange={e => setProductForm({...productForm, gst_percent: e.target.value})} />
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>Add Product</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function StockReportSection({ entries, sales }) {
  // Simple Bar Chart Logic (Last 14 days)
  const last14Days = useMemo(() => {
    const days = []
    for (let i = 13; i >= 0; i--) {
      days.push(subDays(new Date(), i))
    }
    return days.map(d => {
      const dayEntriesIn = entries.filter(e => e.type === 'in' && isSameDay(new Date(e.created_at), d)).reduce((s, e) => s + Number(e.quantity), 0)
      const daySales = sales.filter(sl => isSameDay(new Date(sl.created_at), d)).reduce((s, sl) => s + Number(sl.quantity), 0)
      return { 
          date: format(d, 'dd MMM'),
          in: dayEntriesIn,
          sales: daySales
      }
    })
  }, [entries, sales])

  const maxVal = Math.max(...last14Days.map(d => Math.max(d.in, d.sales)), 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
       <div className="card">
          <h4 style={{ marginBottom: '1.5rem', fontSize: 15 }}>Inventory Movement (Last 14 Days)</h4>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5%', height: 200, paddingBottom: 25, position: 'relative' }}>
             {last14Days.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2, height: '100%' }}>
                   <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%', width: '100%' }}>
                      <div style={{ 
                         width: '45%', 
                         height: `${(d.in / maxVal) * 100}%`, 
                         background: '#10b981', 
                         borderRadius: '2px 2px 0 0',
                         minHeight: d.in > 0 ? 3 : 0,
                         transition: 'height 0.3s ease'
                      }} title={`In: ${d.in}`} />
                      <div style={{ 
                         width: '45%', 
                         height: `${(d.sales / maxVal) * 100}%`, 
                         background: '#f59e0b', 
                         borderRadius: '2px 2px 0 0',
                         minHeight: d.sales > 0 ? 3 : 0,
                         transition: 'height 0.3s ease'
                      }} title={`Sales: ${d.sales}`} />
                   </div>
                   <div style={{ fontSize: 9, textAlign: 'center', color: 'var(--text-muted)', position: 'absolute', bottom: 5, left: `${(i / 13) * 100}%`, width: '7%', transform: 'translateX(-50%)' }}>
                      {d.date}
                   </div>
                </div>
             ))}
          </div>
          <div style={{ display: 'flex', gap: 15, fontSize: 11, marginTop: 10, justifyContent: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: '#10b981' }} /> Stock In
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: '#f59e0b' }} /> Sales
             </div>
          </div>
       </div>

       <div className="card" style={{ padding: '1.25rem' }}>
          <h4>Monthly Comparison</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Coming soon: Advanced analytics and cross-product comparisons.</p>
       </div>
    </div>
  )
}
