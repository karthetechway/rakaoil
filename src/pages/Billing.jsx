import { useCallback, useEffect, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { saveBill, fetchCustomers } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { printReceipt } from '../lib/printReceipt'

const CATS = ['All', 'Oils', 'Ghee', 'Dal & Sugar']
const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'J Oil Mill'
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || ''
const SHOP_PHONE = import.meta.env.VITE_SHOP_PHONE || ''

export default function Billing() {
  const { products, loading } = useProducts()
  const toast = useToast()

  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})

  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [nameError, setNameError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [returning, setReturning] = useState(false)

  const [payMode, setPayMode] = useState('cash')
  const [discount, setDiscount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [lastAddedId, setLastAddedId] = useState(null)

  // ── Products filter & group ────────────────────────────────
  const filtered = products.filter(p => {
    const matchCat = cat === 'All' || p.category === cat
    const q = search.toLowerCase()
    return matchCat && (!q || p.name.toLowerCase().includes(q) || (p.name_tamil || '').includes(q))
  })
  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = []
    acc[p.name].push(p)
    return acc
  }, {})

  // ── Cart ───────────────────────────────────────────────────
  const addBatchItems = (p, qty) => {
    setCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + qty }))
    setLastAddedId(p.id)
    setTimeout(() => setLastAddedId(null), 300)
    toast(`${qty} × ${p.size} ${p.name} added!`)
  }
  const changeQty = (id, d) => setCart(c => {
    const q = (c[id] || 0) + d
    if (q <= 0) { const n = { ...c }; delete n[id]; return n }
    return { ...c, [id]: q }
  })
  const removeItem = id => setCart(c => { const n = { ...c }; delete n[id]; return n })
  const clearAll = () => {
    setCart({}); setCustName(''); setCustPhone('')
    setDiscount(0); setPhoneError(''); setNameError(''); setReturning(false)
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id === id)
    if (!p) return null
    return { product_id: p.id, product_name: p.name, size: p.size, quantity: qty, unit_price: p.price, line_total: p.price * qty }
  }).filter(Boolean)

  const totalItems = cartItems.reduce((s, i) => s + i.quantity, 0)
  const subtotal = cartItems.reduce((s, i) => s + i.line_total, 0)
  const total = Math.max(0, subtotal - Number(discount))

  // ── Returning customer lookup ──────────────────────────────
  const lookupPhone = useCallback(async (phone) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setReturning(false); return }
    setLookingUp(true)
    try {
      const results = await fetchCustomers(digits)
      if (results && results.length > 0) {
        const c = results[0]
        setCustName(c.name || '')
        setReturning(true)
        toast(`Welcome back${c.name ? ', ' + c.name : ''}! ${c.visit_count} visit(s)`)
      } else {
        setReturning(false)
      }
    } catch (_) { }
    setLookingUp(false)
  }, [toast])

  useEffect(() => {
    const t = setTimeout(() => lookupPhone(custPhone), 600)
    return () => clearTimeout(t)
  }, [custPhone, lookupPhone])

  // ── Validate ───────────────────────────────────────────────
  const validate = () => {
    let ok = true
    if (!custName.trim()) { setNameError('Customer name is required'); ok = false } else setNameError('')
    if (custPhone.replace(/\D/g, '').length < 10) {
      setPhoneError('Enter a valid 10-digit mobile number'); ok = false
    } else setPhoneError('')
    if (!cartItems.length) { toast('Add at least one item', 'error'); ok = false }
    return ok
  }

  // ── Save core ──────────────────────────────────────────────
  const doSave = async () => {
    const itemsSnap = [...cartItems]
    const custSnap = { name: custName.trim(), phone: custPhone.replace(/\D/g, '') }
    const discSnap = Number(discount)
    const totalSnap = total
    const paySnap = payMode

    const bill = await saveBill({
      items: itemsSnap,
      customer: custSnap,
      paymentMode: paySnap,
      discount: discSnap,
    })
    clearAll()
    setIsDrawerOpen(false)
    return { bill, itemsSnap, custSnap, discSnap, totalSnap, paySnap }
  }

  // ── Save & Print ───────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const { bill, itemsSnap, custSnap, discSnap, totalSnap, paySnap } = await doSave()
      toast(`Bill #${bill.bill_number} saved!`)
      // Print in popup — works 100% regardless of CSS
      printReceipt({ bill, items: itemsSnap, customer: custSnap, paymentMode: paySnap, discount: discSnap, total: totalSnap })
    } catch (e) {
      toast(e.message || 'Failed to save bill', 'error')
    }
    setSaving(false)
  }

  // ── WhatsApp ───────────────────────────────────────────────
  const buildWhatsAppMsg = (bill, items, cust, mode, tot, disc) => {
    const lines = items.map(i => `  • ${i.product_name} ${i.size} ×${i.quantity} = ₹${i.line_total.toFixed(2)}`).join('\n')
    const sub = items.reduce((s, i) => s + i.line_total, 0)
    return [
      `*${SHOP_NAME}*`,
      SHOP_ADDRESS || null,
      SHOP_PHONE ? `Ph: ${SHOP_PHONE}` : null,
      '',
      `Bill No : *#${bill.bill_number}*`,
      `Date    : ${new Date().toLocaleDateString('en-IN')}`,
      `Customer: ${cust.name} | ${cust.phone}`,
      '',
      '*Items:*',
      lines,
      '',
      disc > 0 ? `Subtotal : ₹${sub.toFixed(2)}` : null,
      disc > 0 ? `Discount : -₹${Number(disc).toFixed(2)}` : null,
      `*Total   : ₹${tot.toFixed(2)}*`,
      `Payment : ${mode.toUpperCase()}`,
      '',
      'நன்றி! மீண்டும் வாருங்கள் 🙏',
    ].filter(l => l !== null).join('\n')
  }

  const handleWhatsApp = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const { bill, itemsSnap, custSnap, discSnap, totalSnap, paySnap } = await doSave()
      toast(`Bill #${bill.bill_number} saved!`)
      const msg = buildWhatsAppMsg(bill, itemsSnap, custSnap, paySnap, totalSnap, discSnap)
      const num = custSnap.phone.replace(/\D/g, '')
      window.open(`https://wa.me/91${num}?text=${encodeURIComponent(msg)}`, '_blank')
    } catch (e) {
      toast(e.message || 'Failed to save bill', 'error')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading products…</div>







  // ── Render Helpers ─────────────────────────────────────────
  function renderBillTotals() {
    return (
      <div className="tot-rows">
        <div className="tot-row">
          <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
          <span className="val">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="tot-row" style={{ alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Discount (₹)</span>
          <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
            style={{ width: 70, textAlign: 'right', padding: '3px 6px', fontSize: 13 }}
          />
        </div>
        <div className="tot-row grand-row">
          <span>Total</span><span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    )
  }

  function renderPaymentButtons() {
    return (
      <div className="pay-btns" style={{ marginTop: 10 }}>
        {['cash', 'upi', 'card'].map(m => (
          <button key={m} className={`pay-btn${payMode === m ? ' active' : ''}`} onClick={() => setPayMode(m)}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  function renderActionButtons() {
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button className="btn btn-outline btn-sm" onClick={clearAll} disabled={saving} style={{ flex: 1 }}>
          Clear
        </button>
        <button className="btn btn-whatsapp" onClick={handleWhatsApp} disabled={saving || !cartItems.length} style={{ flex: 1.5 }}>
          {saving ? '…' : '💬 WhatsApp'}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !cartItems.length} style={{ flex: 2 }}>
          {saving ? 'Saving…' : 'Save & Print'}
        </button>
      </div>
    )
  }

  function renderCustomerForm() {
    return (
      <div style={{ padding: '.75rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            Mobile Number <span style={{ color: 'var(--red)', fontSize: 11 }}>*</span>
            {lookingUp && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>searching…</span>}
            {returning && !lookingUp && (
              <span style={{ fontSize: 11, background: '#e8f5ec', color: '#3a7d51', padding: '1px 8px', borderRadius: 99 }}>
                Returning customer ✓
              </span>
            )}
          </label>
          <input type="tel" value={custPhone}
            onChange={e => { setCustPhone(e.target.value); setPhoneError('') }}
            placeholder="10-digit mobile number"
            style={{ borderColor: phoneError ? 'var(--red)' : undefined }}
          />
          {phoneError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{phoneError}</div>}
        </div>
        <div>
          <label style={{ marginBottom: 4 }}>
            Customer Name <span style={{ color: 'var(--red)', fontSize: 11 }}>*</span>
          </label>
          <input type="text" value={custName}
            onChange={e => { setCustName(e.target.value); setNameError('') }}
            placeholder="Full name"
            style={{ borderColor: nameError ? 'var(--red)' : undefined }}
          />
          {nameError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 3 }}>{nameError}</div>}
        </div>
      </div>
    )
  }

  function renderCartItems() {
    return (
      <div className="bill-panel-body">
        {!cartItems.length
          ? <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Tap a product size on the left to add
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
    )
  }

  return (
    <div className="billing-layout">
      {/* LEFT: Products */}
      <div className="bill-panel">
        <div className="prod-search">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or Tamil name…" />
        </div>
        <div className="cat-strip">
          {CATS.map(c => (
            <button key={c} className={`cat-chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="bill-panel-body">
          <div className="products-list">
            {Object.entries(grouped).map(([name, items]) => (
              <ProductRow
                key={name}
                name={name}
                items={items}
                onAdd={addBatchItems}
                isLastAdded={items.some(i => i.id === lastAddedId)}
              />
            ))}
            {!Object.keys(grouped).length && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: '2rem 0' }}>
                No products found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Bill (Desktop) */}
      <div className="bill-panel checkout desktop-only">
        <div className="bill-panel-head">
          <h3>Current Bill</h3>
          <span className="badge badge-brown">{totalItems} items</span>
        </div>
        {renderCustomerForm()}
        {renderCartItems()}
        <div className="bill-panel-foot">
          {renderBillTotals()}
          {renderPaymentButtons()}
          {renderActionButtons()}
        </div>
      </div>

      {/* Mobile Summary Bar (Sticky) */}
      {cartItems.length > 0 && (
        <div className="mobile-summary" onClick={() => setIsDrawerOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="count">{totalItems} items</span>
            <span className="total">₹{total.toFixed(2)}</span>
          </div>
          <button className="btn btn-primary btn-sm" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            View Bill →
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      {isDrawerOpen && (
        <>
          <div className="cart-drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />
          <div className="cart-drawer">
            <div className="drawer-handle" />
            <div className="bill-panel-head">
              <h3>Checkout Details</h3>
              <button className="del-btn" style={{ fontSize: 24 }} onClick={() => setIsDrawerOpen(false)}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {renderCustomerForm()}
              {renderCartItems()}
            </div>
            <div className="bill-panel-foot" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
              {renderBillTotals()}
              {renderPaymentButtons()}
              {renderActionButtons()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProductRow({ name, items, onAdd, isLastAdded }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id)
  const [qty, setQty] = useState(1)

  const selectedProduct = items.find(i => i.id === selectedId)

  const doAdd = () => {
    if (!selectedProduct) return
    onAdd(selectedProduct, qty)
    setQty(1) // Reset quantity to 1 after adding
  }

  return (
    <div className={`product-row ${isLastAdded ? 'animate-pulse' : ''}`}>
      <div className="p-info">
        <div className="pname">{name}</div>
        <div className="ptamil">{items[0].name_tamil}</div>
      </div>

      <div className="size-chips">
        {items.map(p => (
          <button
            key={p.id}
            className={`chip ${selectedId === p.id ? 'active' : ''}`}
            onClick={() => setSelectedId(p.id)}
          >
            <span>{p.size}</span>
            <span className="c-price">₹{p.price}</span>
          </button>
        ))}
      </div>

      <div className="row-actions">
        <div className="qty-ctrl">
          <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span className="qty-num">{qty}</span>
          <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
        </div>
        <button className="add-btn" onClick={doAdd} disabled={!selectedProduct}>
          Add
        </button>
      </div>
    </div>
  )
}
