import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fetchBills, cancelBill, supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { printReceipt } from '../lib/printReceipt'

export default function History() {
  const [bills, setBills]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [date, setDate]         = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expanded, setExpanded] = useState(null)
  const [actioning, setActioning] = useState(null) // bill id being acted on
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBills({ date })
      setBills(data)
    } catch (e) {
      toast(e.message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [date])

  // ── Print receipt from history ─────────────────────────────
  const handlePrint = (e, b) => {
    e.stopPropagation()
    printReceipt({
      bill:        b,
      items:       b.bill_items || [],
      customer:    b.customers  || {},
      paymentMode: b.payment_mode,
      discount:    b.discount   || 0,
      total:       Number(b.total),
    })
  }

  // ── Save as PDF ────────────────────────────────────────────
  const handleSavePDF = (e, b) => {
    e.stopPropagation()
    // Build receipt HTML then open in popup and use browser's Save as PDF
    const items   = b.bill_items || []
    const safeTotal    = Number(b.total)
    const safeSubtotal = items.reduce((s, i) => s + Number(i.line_total), 0)
    const safeDiscount = Number(b.discount) || 0
    const dateStr = format(new Date(b.created_at), 'dd/MM/yyyy hh:mm a')

    const SHOP_NAME    = import.meta.env.VITE_SHOP_NAME    || 'Chekku Oil Shop'
    const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || ''
    const SHOP_PHONE   = import.meta.env.VITE_SHOP_PHONE   || ''
    const SHOP_EMAIL   = import.meta.env.VITE_SHOP_EMAIL   || ''
    const SHOP_GST     = import.meta.env.VITE_SHOP_GST     || ''

    const itemRows = items.map((i, idx) => `
      <div class="item">
        <div class="item-row">
          <span class="item-name">${i.product_name} — ${i.size}</span>
          <span class="item-amt">&#8377;${Number(i.line_total).toFixed(2)}</span>
        </div>
        <div class="item-sub">${i.quantity} pcs &times; &#8377;${Number(i.unit_price).toFixed(2)}</div>
      </div>
      ${idx < items.length - 1 ? '<div class="dash" style="margin: 4px 0; border-top-style: dotted; opacity: 0.3;"></div>' : ''}
    `).join('')

    const discRows = safeDiscount > 0 ? `
      <div class="tot-row"><span>Subtotal</span><span>&#8377;${safeSubtotal.toFixed(2)}</span></div>
      <div class="tot-row"><span>Discount</span><span>-&#8377;${safeDiscount.toFixed(2)}</span></div>` : ''

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>Bill #${b.bill_number}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Courier New',monospace;font-size:13px;color:#000;background:#fff;width:80mm;padding:8px}
        .center{text-align:center}.bold{font-weight:bold}
        .dash{border-top:1px dashed #000;margin:7px 0}
        .shop-name{font-size:16px;font-weight:bold}
        .meta{margin-bottom:7px;line-height:1.8}
        .items-hd{display:flex;justify-content:space-between;font-weight:bold;margin-bottom:5px}
        .item{margin-bottom:7px}
        .item-row{display:flex;justify-content:space-between}
        .item-name{max-width:68%;word-break:break-word}
        .item-amt{font-weight:bold;white-space:nowrap}
        .item-sub{font-size:11px;color:#555;padding-left:4px}
        .tot-row{display:flex;justify-content:space-between;padding:2px 0;font-size:13px}
        .grand{display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin-top:4px}
        .footer{text-align:center;font-size:12px;margin-top:4px}
        @media print{body{width:80mm}@page{margin:2mm;size:80mm auto}}
      </style></head><body>
      <div class="center" style="margin-bottom:8px">
        <div class="shop-name">${SHOP_NAME}</div>
        ${SHOP_ADDRESS ? `<div>${SHOP_ADDRESS}</div>` : ''}
        ${SHOP_PHONE   ? `<div>Ph: ${SHOP_PHONE}</div>` : ''}
        ${SHOP_EMAIL   ? `<div>Email: ${SHOP_EMAIL}</div>` : ''}
        ${SHOP_GST     ? `<div>${SHOP_GST}</div>` : ''}
      </div>
      <div class="dash"></div>
      <div class="meta">
        <div>Bill No : <strong>#${b.bill_number}</strong></div>
        <div>Date    : ${dateStr}</div>
        ${b.customers?.name  ? `<div>Name    : ${b.customers.name}</div>`  : ''}
        ${b.customers?.phone ? `<div>Phone   : ${b.customers.phone}</div>` : ''}
        <div>Payment : <strong>${(b.payment_mode || '').toUpperCase()}</strong></div>
      </div>
      <div class="dash"></div>
      <div class="items-hd"><span>Item</span><span>Amt</span></div>
      ${itemRows}
      <div class="dash"></div>
      ${discRows}
      <div class="grand"><span>TOTAL</span><span>&#8377;${safeTotal.toFixed(2)}</span></div>
      <div class="dash"></div>
      <div class="footer">
        <div>Thank you! Come again</div>
        <div>&#2984;&#2985;&#3021;&#2993;&#3007;! &#2990;&#3008;&#2979;&#3021;&#2975;&#3009;&#2990;&#3021; &#2997;&#3006;&#2992;&#3009;&#2984;&#3021;&#2965;&#2995;&#3021;</div>
      </div>
    </body></html>`

    const popup = window.open('', '_blank', 'width=380,height=650')
    if (!popup) { alert('Please allow popups for this site to save as PDF.'); return }
    popup.document.open()
    popup.document.write(html)
    popup.document.close()
    popup.onload = () => {
      popup.focus()
      // Instruct user to use Save as PDF in the print dialog
      popup.print()
    }
    setTimeout(() => {
      try { if (!popup.closed) { popup.focus(); popup.print() } } catch (_) {}
    }, 800)
    toast(`Bill #${b.bill_number}: In the print dialog, set Destination → "Save as PDF"`)
  }

  // ── Cancel bill ────────────────────────────────────────────
  const handleCancel = async (e, b) => {
    e.stopPropagation()
    if (!window.confirm(`Cancel Bill #${b.bill_number}? This cannot be undone.`)) return
    setActioning(b.id)
    try {
      await cancelBill(b.id)
      toast(`Bill #${b.bill_number} cancelled`)
      load()
    } catch (e) { toast(e.message, 'error') }
    setActioning(null)
  }

  // ── Delete bill permanently ────────────────────────────────
  const handleDelete = async (e, b) => {
    e.stopPropagation()
    if (!window.confirm(`Permanently DELETE Bill #${b.bill_number}?\n\nThis will remove it from all records and CANNOT be undone.`)) return
    setActioning(b.id)
    try {
      // bill_items deleted via CASCADE in DB
      const { error } = await supabase.from('bills').delete().eq('id', b.id)
      if (error) throw error
      toast(`Bill #${b.bill_number} deleted`)
      load()
    } catch (e) { toast(e.message, 'error') }
    setActioning(null)
  }

  const paidBills      = bills.filter(b => b.status === 'paid')
  const cancelledBills = bills.filter(b => b.status === 'cancelled')
  const dayTotal       = paidBills.reduce((s, b) => s + Number(b.total), 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Bill History</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      {/* Day summary */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Day Total</div>
          <div className="stat-val">₹{dayTotal.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bills</div>
          <div className="stat-val">{paidBills.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelled</div>
          <div className="stat-val">{cancelledBills.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : bills.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bills for this date.</div>
        ) : (
            <div className="admin-list">
              {bills.map(b => (
                <div key={b.id} className="admin-item" 
                     onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                     style={{ cursor: 'pointer' }}>
                  
                  <div className="ai-main">
                    <div>
                      <div className="pname">Bill #{b.bill_number}</div>
                      <div className="ptamil">{format(new Date(b.created_at), 'hh:mm a')} • {b.customers?.name || 'Walk-in'}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                        <span className={`badge ${b.status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                          {b.status.toUpperCase()}
                        </span>
                        <span className="badge badge-gold">{b.payment_mode.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ai-price">
                      <span>₹{Number(b.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {expanded === b.id && (
                    <div className="ai-details" style={{ padding: '1rem', background: 'var(--cream)', borderRadius: 8, marginTop: 4 }}>
                       <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Items Breakdown:</div>
                       {(b.bill_items || []).map(i => (
                         <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span>{i.product_name} ({i.size}) x {i.quantity}</span>
                            <span>₹{i.line_total}</span>
                         </div>
                       ))}
                       {Number(b.discount) > 0 && (
                         <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 4, textAlign: 'right', fontSize: 12 }}>
                           Discount: -₹{b.discount}
                         </div>
                       )}
                    </div>
                  )}

                  <div className="ai-actions" onClick={e => e.stopPropagation()}>
                    <div className="ai-btns" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                      <button className="btn btn-outline btn-sm" onClick={e => handlePrint(e, b)} disabled={actioning === b.id}>
                        🖨️ Print
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={e => handleSavePDF(e, b)} disabled={actioning === b.id}>
                        📄 PDF
                      </button>
                      {b.status === 'paid' && (
                        <button className="btn btn-outline btn-sm" onClick={e => handleCancel(e, b)} disabled={actioning === b.id}>
                          Cancel
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={e => handleDelete(e, b)} disabled={actioning === b.id}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  )
}
