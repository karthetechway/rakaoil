import { forwardRef } from 'react'
import { format } from 'date-fns'

const SHOP_NAME    = import.meta.env.VITE_SHOP_NAME    || 'Sri Murugan Chekku Oil'
const SHOP_ADDRESS = import.meta.env.VITE_SHOP_ADDRESS || 'Salem, Tamil Nadu'
const SHOP_PHONE   = import.meta.env.VITE_SHOP_PHONE   || ''
const SHOP_GST     = import.meta.env.VITE_SHOP_GST     || ''

const Receipt = forwardRef(({ bill, items, customer, paymentMode }, ref) => {
  const total = items.reduce((s, i) => s + i.line_total, 0)
  const now = new Date()

  return (
    <div ref={ref} className="print-receipt" style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', padding: 8 }}>
      <style>{`
        @media print {
          .print-receipt { display: block !important; font-family: monospace; font-size: 12px; width: 72mm; }
          body > * { display: none; }
          .print-receipt { display: block !important; }
        }
      `}</style>

      <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold' }}>{SHOP_NAME}</div>
        <div>{SHOP_ADDRESS}</div>
        {SHOP_PHONE && <div>Ph: {SHOP_PHONE}</div>}
        {SHOP_GST && <div>{SHOP_GST}</div>}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div>Bill No : #{bill?.bill_number ?? '—'}</div>
        <div>Date    : {format(now, 'dd/MM/yyyy hh:mm a')}</div>
        {customer?.name  && <div>Name    : {customer.name}</div>}
        {customer?.phone && <div>Phone   : {customer.phone}</div>}
        <div>Payment : {paymentMode?.toUpperCase()}</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '6px 0', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 4 }}>
          <span>Item</span><span>Amt</span>
        </div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>{item.product_name} {item.size}<br />
              <span style={{ fontSize: 11 }}>  {item.quantity} x ₹{item.unit_price}</span>
            </span>
            <span>₹{item.line_total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold' }}>Total: ₹{total.toFixed(2)}</div>
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: 8, fontSize: 11 }}>
        <div>Thank you! Come again</div>
        <div>நன்றி! மீண்டும் வாருங்கள்</div>
      </div>
    </div>
  )
})

Receipt.displayName = 'Receipt'
export default Receipt
