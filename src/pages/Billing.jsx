import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useProducts } from '../hooks/useProducts'
import { saveBill } from '../lib/supabase'
import { useToast } from '../components/Toast'
import Receipt from '../components/Receipt'

const CATS = ['All', 'Oils', 'Ghee', 'Dal & Sugar']

export default function Billing() {
  const { products, loading } = useProducts()
  const toast = useToast()
  const receiptRef = useRef()

  const [cat, setCat]         = useState('All')
  const [search, setSearch]   = useState('')
  const [cart, setCart]       = useState({})           // { productId: qty }
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [payMode, setPayMode] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [saving, setSaving]   = useState(false)
  const [lastBill, setLastBill] = useState(null)

  // ── Filtered products ──────────────────────────────────────
  const filtered = products.filter(p => {
    const matchCat = cat === 'All' || p.category === cat
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || (p.name_tamil || '').includes(q)
    return matchCat && matchQ
  })

  // Group by name
  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = []
    acc[p.name].push(p)
    return acc
  }, {})

  // ── Cart helpers ───────────────────────────────────────────
  const addItem = (product) => setCart(c => ({ ...c, [product.id]: (c[product.id] || 0) + 1 }))
  const changeQty = (id, delta) => setCart(c => {
    const newQty = (c[id] || 0) + delta
    if (newQty <= 0) { const n = { ...c }; delete n[id]; return n }
    return { ...c, [id]: newQty }
  })
  const removeItem = (id) => setCart(c => { const n = { ...c }; delete n[id]; return n })
  const clearCart = () => { setCart({}); setCustName(''); setCustPhone(''); setDiscount(0) }

  // ── Cart items ─────────────────────────────────────────────
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === id)
    if (!p) return null
    return { product_id: p.id, product_name: p.name, size: p.size, quantity: qty, unit_price: p.price, line_total: p.price * qty }
  }).filter(Boolean)

  const subtotal = cartItems.reduce((s, i) => s + i.line_total, 0)
  const total    = Math.max(0, subtotal - Number(discount))

  // ── Save bill ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!cartItems.length) return toast('Add at least one item', 'error')
    setSaving(true)
    try {
      const bill = await saveBill({
        items: cartItems,
        customer: custPhone ? { name: custName, phone: custPhone } : null,
        paymentMode: payMode,
        discount: Number(discount),
      })
      setLastBill(bill)
      toast(`Bill #${bill.bill_number} saved!`)
      setTimeout(() => handlePrint(), 200)
      clearCart()
    } catch (e) {
      toast(e.message, 'error')
    }
    setSaving(false)
  }

  const handlePrint = useReactToPrint({ content: () => receiptRef.current })

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading products…</div>

  return (
    <div className="billing-layout">

      {/* ── LEFT: Product selector ── */}
      <div className="bill-panel">
        <div className="prod-search">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or Tamil name…"
          />
        </div>

        <div className="cat-strip">
          {CATS.map(c => (
            <button key={c} className={`cat-chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="bill-panel-body">
          <div className="products-grid">
            {Object.entries(grouped).map(([name, items]) => (
              <div key={name} className="product-card">
                <div className="pname">{name}</div>
                <div className="ptamil">{items[0].name_tamil}</div>
                {items.map(p => (
                  <button key={p.id} className="size-btn" onClick={() => addItem(p)}>
                    <span>{p.size}</span>
                    <span>₹{p.price}</span>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div style={{ gridColumn: '1/-1', color: 'var(--text-muted)', fontSize: 14, padding: '1rem 0' }}>
                No products found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Bill panel ── */}
      <div className="bill-panel">
        <div className="bill-panel-head">
          <h3>Current Bill</h3>
          <span className="badge badge-brown">{cartItems.length} items</span>
        </div>

        {/* Customer info */}
        <div style={{ padding: '.7rem 1.1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            value={custName} onChange={e => setCustName(e.target.value)}
            placeholder="Customer name" style={{ flex: 1 }}
          />
          <input
            value={custPhone} onChange={e => setCustPhone(e.target.value)}
            placeholder="Phone" style={{ flex: 1 }}
          />
        </div>

        {/* Cart items */}
        <div className="bill-panel-body">
          {!cartItems.length
            ? <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Tap a product size to add it here
              </div>
            : cartItems.map(item => (
              <div key={item.product_id} className="bill-item">
                <div>
                  <div className="bi-name">{item.product_name}</div>
                  <div className="bi-size">{item.size} × ₹{item.unit_price}</div>
                </div>
                <div className="qty-ctrl">
                  <button className="qty-btn" onClick={() => changeQty(item.product_id, -1)}>−</button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => changeQty(item.product_id, +1)}>+</button>
                </div>
                <div className="bi-price">₹{item.line_total.toFixed(2)}</div>
                <button className="del-btn" onClick={() => removeItem(item.product_id)}>×</button>
              </div>
            ))
          }
        </div>

        {/* Totals & actions */}
        <div className="bill-panel-foot">
          <div className="tot-row">
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span className="val">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="tot-row" style={{ alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Discount (₹)</span>
            <input
              type="number" min="0" value={discount}
              onChange={e => setDiscount(e.target.value)}
              style={{ width: 70, textAlign: 'right', padding: '3px 6px', fontSize: 13 }}
            />
          </div>
          <div className="tot-row grand-row">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          {/* Payment mode */}
          <div className="pay-btns" style={{ marginTop: 10 }}>
            {['cash', 'upi', 'card'].map(m => (
              <button key={m} className={`pay-btn${payMode === m ? ' active' : ''}`} onClick={() => setPayMode(m)}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={clearCart} style={{ flex: 1 }}>
              Clear
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !cartItems.length} style={{ flex: 2 }}>
              {saving ? 'Saving…' : 'Save & Print'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden receipt for printing */}
      <Receipt
        ref={receiptRef}
        bill={lastBill}
        items={cartItems}
        customer={{ name: custName, phone: custPhone }}
        paymentMode={payMode}
      />
    </div>
  )
}
