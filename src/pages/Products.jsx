import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { updateProductPrice, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import AdminPinGate from '../components/AdminPinGate'

const CATEGORIES = ['Oils', 'Ghee', 'Dal & Sugar']
const UNITS      = ['ml', 'L', 'g', 'Kg']
const EMPTY_FORM = { name: '', name_tamil: '', category: 'Oils', size: '', unit: 'ml', price: '' }

// All product mutations are wrapped in this component — shown only after PIN
function ProductsContent() {
  const { products, loading, reload } = useProducts({ showAll: true })
  const [editing, setEditing]   = useState({})
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [addLoading, setAddLoading] = useState(false)
  const toast = useToast()

  // ── Sanitise inputs ────────────────────────────────────────
  const sanitiseText  = v => String(v).replace(/[<>"'`]/g, '').trim()
  const sanitisePrice = v => Math.abs(parseFloat(v) || 0)

  // ── Price inline edit ──────────────────────────────────────
  const handlePriceChange = (id, val) => {
    // Only allow numeric input
    if (!/^\d*\.?\d*$/.test(val)) return
    setEditing(e => ({ ...e, [id]: val }))
  }

  const handlePriceSave = async (id) => {
    const price = sanitisePrice(editing[id])
    if (!price || price <= 0) return toast('Enter a valid price', 'error')
    if (price > 99999)        return toast('Price seems too high. Check and try again.', 'error')
    try {
      await updateProductPrice(id, price)
      setEditing(e => { const n = { ...e }; delete n[id]; return n })
      toast('Price updated!')
      reload()
    } catch (e) { toast(e.message, 'error') }
  }

  const toggleActive = async (id, current) => {
    try {
      await supabase.from('products').update({ active: !current }).eq('id', id)
      toast(current ? 'Product hidden from billing' : 'Product shown in billing')
      reload()
    } catch (e) { toast(e.message, 'error') }
  }

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await supabase.from('products').delete().eq('id', id)
      toast('Product deleted')
      reload()
    } catch (e) { toast(e.message, 'error') }
  }

  // ── Add new product ────────────────────────────────────────
  const setF = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setFormErrors(e => ({ ...e, [key]: '' }))
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim())            errs.name  = 'Product name is required'
    if (!form.size.trim())            errs.size  = 'Size is required (e.g. 200ml, 500g)'
    const price = sanitisePrice(form.price)
    if (!price || price <= 0)         errs.price = 'Enter a valid price'
    if (price > 99999)                errs.price = 'Price is too high'
    // Prevent XSS in name fields
    if (/[<>"'`]/.test(form.name))    errs.name  = 'Name contains invalid characters'
    if (/[<>"'`]/.test(form.name_tamil)) errs.name_tamil = 'Contains invalid characters'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddProduct = async () => {
    if (!validateForm()) return
    setAddLoading(true)
    try {
      const maxSort = products.length ? Math.max(...products.map(p => p.sort_order || 0)) : 0
      await supabase.from('products').insert({
        name:       sanitiseText(form.name),
        name_tamil: sanitiseText(form.name_tamil) || null,
        category:   form.category,           // enum-constrained, no sanitise needed
        size:       sanitiseText(form.size),
        unit:       form.unit,               // select dropdown, safe
        price:      sanitisePrice(form.price),
        active:     true,
        sort_order: maxSort + 1,
      })
      toast(`"${form.name} ${form.size}" added!`)
      setForm(EMPTY_FORM)
      setShowAdd(false)
      setFormErrors({})
      reload()
    } catch (e) { toast(e.message, 'error') }
    setAddLoading(false)
  }

  // Group by category (all products visible here including hidden ones)
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: 8 }}>
        <button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(s => !s)}>
          {showAdd ? '✕ Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* ── Add product form ── */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--gold)', borderWidth: 1.5 }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--brown-dark)' }}>Add New Product</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>

            <div>
              <label>Product Name (English) <span style={{ color: 'var(--red)' }}>*</span></label>
              <input value={form.name} onChange={e => setF('name', e.target.value)}
                placeholder="e.g. Sesame Oil" maxLength={80}
                style={{ borderColor: formErrors.name ? 'var(--red)' : undefined }} />
              {formErrors.name && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{formErrors.name}</div>}
            </div>

            <div>
              <label>Tamil Name <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(optional)</span></label>
              <input value={form.name_tamil} onChange={e => setF('name_tamil', e.target.value)}
                placeholder="e.g. எள்ளெண்ணெய்" maxLength={80}
                style={{ borderColor: formErrors.name_tamil ? 'var(--red)' : undefined }} />
              {formErrors.name_tamil && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{formErrors.name_tamil}</div>}
            </div>

            <div>
              <label>Category <span style={{ color: 'var(--red)' }}>*</span></label>
              <select value={form.category} onChange={e => setF('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label>Size <span style={{ color: 'var(--red)' }}>*</span></label>
              <input value={form.size} onChange={e => setF('size', e.target.value)}
                placeholder="e.g. 200ml, 1L, 500g, 1Kg" maxLength={20}
                style={{ borderColor: formErrors.size ? 'var(--red)' : undefined }} />
              {formErrors.size && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{formErrors.size}</div>}
            </div>

            <div>
              <label>Unit</label>
              <select value={form.unit} onChange={e => setF('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label>Price (₹) <span style={{ color: 'var(--red)' }}>*</span></label>
              <input type="number" min="1" max="99999" step="0.01" value={form.price}
                onChange={e => setF('price', e.target.value)}
                placeholder="e.g. 95"
                style={{ borderColor: formErrors.price ? 'var(--red)' : undefined }} />
              {formErrors.price && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{formErrors.price}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); setFormErrors({}) }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddProduct} disabled={addLoading}>
              {addLoading ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </div>
      )}

      {/* ── Products by category ── */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '.75rem', color: 'var(--brown)' }}>{cat}</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Tamil</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Update Price</th>
                  <th>Billing</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.5 }}>
                    <td><strong>{p.name}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.name_tamil || '—'}</td>
                    <td>{p.size}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>₹{p.price}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number" min="1" max="99999" step="0.01"
                          value={editing[p.id] ?? ''}
                          onChange={e => handlePriceChange(p.id, e.target.value)}
                          placeholder={p.price}
                          style={{ width: 80 }}
                        />
                        {editing[p.id] && (
                          <button className="btn btn-primary btn-sm" onClick={() => handlePriceSave(p.id)}>
                            Save
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${p.active ? 'btn-outline' : 'btn-danger'}`}
                        onClick={() => toggleActive(p.id, p.active)}
                      >
                        {p.active ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id, `${p.name} ${p.size}`)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!Object.keys(grouped).length && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No products yet. Click "+ Add Product" above.
        </div>
      )}
    </div>
  )
}

// Outer wrapper — shows PIN gate first, then content
export default function Products() {
  return (
    <div className="page">
      <div className="page-header">
        <h2>Products & Prices</h2>
        <span className="badge badge-gold" style={{ fontSize: 12 }}>🔐 PIN Protected</span>
      </div>
      <AdminPinGate title="Products Admin Access">
        <ProductsContent />
      </AdminPinGate>
    </div>
  )
}
