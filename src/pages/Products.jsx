import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { updateProductPrice, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Products() {
  const { products, loading, reload } = useProducts()
  const [editing, setEditing] = useState({})   // { [id]: newPrice }
  const toast = useToast()

  const handlePriceChange = (id, val) => setEditing(e => ({ ...e, [id]: val }))

  const handleSave = async (id) => {
    const price = Number(editing[id])
    if (!price || price <= 0) return toast('Enter a valid price', 'error')
    try {
      await updateProductPrice(id, price)
      setEditing(e => { const n = { ...e }; delete n[id]; return n })
      toast('Price updated!')
      reload()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const toggleActive = async (id, current) => {
    try {
      await supabase.from('products').update({ active: !current }).eq('id', id)
      toast(current ? 'Product hidden' : 'Product shown')
      reload()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading…</div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Products & Prices</h2>
        <button className="btn btn-outline btn-sm" onClick={reload}>Refresh</button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '.75rem', color: 'var(--brown)' }}>{cat}</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Tamil Name</th>
                  <th>Size</th>
                  <th>Current Price (₹)</th>
                  <th>New Price</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.name_tamil}</td>
                    <td>{p.size}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                        ₹{p.price}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number" min="1"
                          value={editing[p.id] ?? ''}
                          onChange={e => handlePriceChange(p.id, e.target.value)}
                          placeholder={p.price}
                          style={{ width: 90 }}
                        />
                        {editing[p.id] && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleSave(p.id)}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
