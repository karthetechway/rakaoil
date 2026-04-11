import React, { forwardRef } from 'react'
import { format } from 'date-fns'

const SHOP_NAME    = import.meta.env.VITE_SHOP_NAME    || 'Sri Murugan Chekku Oil'
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || 'Salem, Tamil Nadu'
const SHOP_PHONE   = import.meta.env.VITE_SHOP_PHONE   || ''
const SHOP_GST     = import.meta.env.VITE_SHOP_GST     || ''

// Receipt is always in the DOM but hidden via CSS.
// Billing.jsx shows it momentarily via el.style.display = 'block'
// then calls window.print(), then hides it again.
// The @media print rule ensures ONLY the receipt prints.

const Receipt = forwardRef(({ bill, items = [], customer, paymentMode, discount = 0, total }, ref) => {
  const safeTotal    = typeof total === 'number' ? total : items.reduce((s, i) => s + i.line_total, 0)
  const safeSubtotal = items.reduce((s, i) => s + i.line_total, 0)
  const safeDiscount = Number(discount) || 0

  return (
    <>
      {/* Print-only global style — hides everything except the receipt */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #chekku-receipt-root { display: block !important; }
          @page { margin: 4mm; size: 80mm auto; }
        }
      `}</style>

      <div
        id="chekku-receipt-root"
        ref={ref}
        style={{ display: 'none', fontFamily: 'monospace', fontSize: 13, color: '#000', background: '#fff', padding: 8, width: '100%' }}
      >
        {/* Shop header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 'bold', fontSize: 15 }}>{SHOP_NAME}</div>
          {SHOP_ADDRESS && <div style={{ fontSize: 12 }}>{SHOP_ADDRESS}</div>}
          {SHOP_PHONE   && <div style={{ fontSize: 12 }}>Ph: {SHOP_PHONE}</div>}
          {SHOP_GST     && <div style={{ fontSize: 12 }}>{SHOP_GST}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Bill meta */}
        <div style={{ marginBottom: 8, fontSize: 13 }}>
          <div>Bill No : <strong>#{bill?.bill_number ?? '—'}</strong></div>
          <div>Date    : {format(new Date(), 'dd/MM/yyyy hh:mm a')}</div>
          {customer?.name  && <div>Name    : {customer.name}</div>}
          {customer?.phone && <div>Phone   : {customer.phone}</div>}
          <div>Payment : <strong>{(paymentMode || 'CASH').toUpperCase()}</strong></div>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Items header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 5 }}>
          <span>Item</span><span>Amt</span>
        </div>

        {/* Items list */}
        {items.length === 0 && (
          <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>No items</div>
        )}
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ maxWidth: '68%', wordBreak: 'break-word' }}>
                {item.product_name} — {item.size}
              </span>
              <span style={{ fontWeight: 'bold' }}>₹{Number(item.line_total).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 11, color: '#444', paddingLeft: 4 }}>
              {item.quantity} pcs × ₹{Number(item.unit_price).toFixed(2)}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

        {/* Totals */}
        {safeDiscount > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Subtotal</span><span>₹{safeSubtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Discount</span><span>-₹{safeDiscount.toFixed(2)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>
          <span>TOTAL</span><span>₹{safeTotal.toFixed(2)}</span>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: 12 }}>
          <div>Thank you! Come again</div>
          <div>நன்றி! மீண்டும் வாருங்கள்</div>
        </div>
      </div>
    </>
  )
})

Receipt.displayName = 'Receipt'
export default Receipt
