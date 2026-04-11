import React, { forwardRef } from 'react'
import { format } from 'date-fns'

const SHOP_NAME    = import.meta.env.VITE_SHOP_NAME    || 'Sri Murugan Chekku Oil'
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || 'Salem, Tamil Nadu'
const SHOP_PHONE   = import.meta.env.VITE_SHOP_PHONE   || ''
const SHOP_GST     = import.meta.env.VITE_SHOP_GST     || ''

const S = {
  wrap:   { fontFamily: 'monospace', fontSize: 13, width: '100%', padding: 10, color: '#000', background: '#fff' },
  center: { textAlign: 'center' },
  dash:   { borderTop: '1px dashed #000', margin: '8px 0' },
  row:    { display: 'flex', justifyContent: 'space-between', marginBottom: 3 },
  bold:   { fontWeight: 'bold' },
  sm:     { fontSize: 11 },
}

const Receipt = forwardRef(({ bill, items = [], customer, paymentMode, discount = 0, total }, ref) => {
  const computedTotal = total ?? items.reduce((s, i) => s + i.line_total, 0)
  const subtotal      = items.reduce((s, i) => s + i.line_total, 0)

  return (
    <div ref={ref} style={{ display: 'none' }}>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; }
          body > * { display: none !important; }
          .chekku-receipt { display: block !important; }
          @page { margin: 0; size: 80mm auto; }
        }
      `}</style>

      <div className="chekku-receipt" style={S.wrap}>
        {/* Shop header */}
        <div style={{ ...S.center, marginBottom: 6 }}>
          <div style={{ ...S.bold, fontSize: 15 }}>{SHOP_NAME}</div>
          {SHOP_ADDRESS && <div style={S.sm}>{SHOP_ADDRESS}</div>}
          {SHOP_PHONE   && <div style={S.sm}>Ph: {SHOP_PHONE}</div>}
          {SHOP_GST     && <div style={S.sm}>{SHOP_GST}</div>}
        </div>

        <div style={S.dash} />

        {/* Bill info */}
        <div style={{ marginBottom: 6 }}>
          <div>Bill No : <strong>#{bill?.bill_number ?? '—'}</strong></div>
          <div>Date    : {format(new Date(), 'dd/MM/yyyy hh:mm a')}</div>
          {customer?.name  && <div>Name    : {customer.name}</div>}
          {customer?.phone && <div>Phone   : {customer.phone}</div>}
          <div>Payment : <strong>{(paymentMode || '').toUpperCase()}</strong></div>
        </div>

        <div style={S.dash} />

        {/* Items header */}
        <div style={{ ...S.row, ...S.bold, marginBottom: 6 }}>
          <span>Item</span><span>Amt</span>
        </div>

        {/* Items */}
        {items.map((item, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={S.row}>
              <span style={{ maxWidth: '65%' }}>{item.product_name} — {item.size}</span>
              <span style={S.bold}>₹{Number(item.line_total).toFixed(2)}</span>
            </div>
            <div style={{ ...S.sm, color: '#555' }}>
              &nbsp;&nbsp;{item.quantity} pcs × ₹{Number(item.unit_price).toFixed(2)}
            </div>
          </div>
        ))}

        <div style={S.dash} />

        {/* Totals */}
        {Number(discount) > 0 && (
          <>
            <div style={S.row}><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div style={S.row}><span>Discount</span><span>-₹{Number(discount).toFixed(2)}</span></div>
          </>
        )}
        <div style={{ ...S.row, ...S.bold, fontSize: 15, marginTop: 4 }}>
          <span>TOTAL</span><span>₹{computedTotal.toFixed(2)}</span>
        </div>

        <div style={S.dash} />

        {/* Footer */}
        <div style={{ ...S.center, ...S.sm, marginTop: 4 }}>
          <div>Thank you! Come again</div>
          <div>நன்றி! மீண்டும் வாருங்கள்</div>
        </div>
      </div>
    </div>
  )
})

Receipt.displayName = 'Receipt'
export default Receipt
