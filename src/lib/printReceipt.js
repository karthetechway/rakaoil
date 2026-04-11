// Opens a tiny popup window, writes receipt HTML into it, and prints it.
// This completely sidesteps the React DOM / CSS media query conflicts.

const SHOP_NAME    = () => import.meta.env.VITE_SHOP_NAME    || 'Chekku Oil Shop'
const SHOP_ADDRESS = () => import.meta.env.VITE_SHOP_ADDRESS || ''
const SHOP_PHONE   = () => import.meta.env.VITE_SHOP_PHONE   || ''
const SHOP_GST     = () => import.meta.env.VITE_SHOP_GST     || ''

function buildReceiptHTML({ bill, items = [], customer, paymentMode, discount = 0, total }) {
  const safeTotal    = typeof total === 'number' ? total : items.reduce((s, i) => s + i.line_total, 0)
  const safeSubtotal = items.reduce((s, i) => s + i.line_total, 0)
  const safeDiscount = Number(discount) || 0
  const now          = new Date()
  const dateStr      = now.toLocaleDateString('en-IN') + ' ' +
                       now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  const itemRows = items.map(item => `
    <div class="item">
      <div class="item-row">
        <span class="item-name">${item.product_name} — ${item.size}</span>
        <span class="item-amt">&#8377;${Number(item.line_total).toFixed(2)}</span>
      </div>
      <div class="item-sub">${item.quantity} pcs &times; &#8377;${Number(item.unit_price).toFixed(2)}</div>
    </div>
  `).join('')

  const discountRows = safeDiscount > 0 ? `
    <div class="tot-row"><span>Subtotal</span><span>&#8377;${safeSubtotal.toFixed(2)}</span></div>
    <div class="tot-row"><span>Discount</span><span>-&#8377;${safeDiscount.toFixed(2)}</span></div>
  ` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Bill #${bill?.bill_number ?? ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 6px;
    }
    .center  { text-align: center; }
    .bold    { font-weight: bold; }
    .dash    { border-top: 1px dashed #000; margin: 7px 0; }
    .shop-name { font-size: 16px; font-weight: bold; }
    .meta    { margin-bottom: 7px; line-height: 1.7; }
    .items-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
    .item    { margin-bottom: 7px; }
    .item-row { display: flex; justify-content: space-between; }
    .item-name { max-width: 68%; word-break: break-word; }
    .item-amt  { font-weight: bold; white-space: nowrap; }
    .item-sub  { font-size: 11px; color: #555; padding-left: 4px; }
    .tot-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
    .grand-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 4px; }
    .footer  { text-align: center; font-size: 12px; margin-top: 4px; }
    @media print {
      body { width: 80mm; }
      @page { margin: 2mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px">
    <div class="shop-name">${SHOP_NAME()}</div>
    ${SHOP_ADDRESS() ? `<div>${SHOP_ADDRESS()}</div>` : ''}
    ${SHOP_PHONE()   ? `<div>Ph: ${SHOP_PHONE()}</div>` : ''}
    ${SHOP_GST()     ? `<div>${SHOP_GST()}</div>` : ''}
  </div>

  <div class="dash"></div>

  <div class="meta">
    <div>Bill No : <strong>#${bill?.bill_number ?? '—'}</strong></div>
    <div>Date    : ${dateStr}</div>
    ${customer?.name  ? `<div>Name    : ${customer.name}</div>`  : ''}
    ${customer?.phone ? `<div>Phone   : ${customer.phone}</div>` : ''}
    <div>Payment : <strong>${(paymentMode || 'CASH').toUpperCase()}</strong></div>
  </div>

  <div class="dash"></div>

  <div class="items-header"><span>Item</span><span>Amt</span></div>

  ${itemRows}

  <div class="dash"></div>

  ${discountRows}
  <div class="grand-row"><span>TOTAL</span><span>&#8377;${safeTotal.toFixed(2)}</span></div>

  <div class="dash"></div>

  <div class="footer">
    <div>Thank you! Come again</div>
    <div>&#2984;&#2985;&#3021;&#2993;&#3007;! &#2990;&#3008;&#2979;&#3021;&#2975;&#3009;&#2990;&#3021; &#2997;&#3006;&#2992;&#3009;&#2984;&#3021;&#2965;&#2995;&#3021;</div>
  </div>
</body>
</html>`
}

export function printReceipt(data) {
  const html = buildReceiptHTML(data)

  // Open a small popup — browsers allow this from user-initiated events
  const popup = window.open('', '_blank', 'width=320,height=600,scrollbars=yes')
  if (!popup) {
    // Popup blocked — show alert
    alert('Print popup was blocked by your browser.\nPlease allow popups for this site:\nClick the popup-blocked icon in the address bar → Allow.')
    return
  }

  popup.document.open()
  popup.document.write(html)
  popup.document.close()

  // Wait for fonts/images to load then print
  popup.onload = () => {
    popup.focus()
    popup.print()
    // Close after a short delay so user sees it printed
    setTimeout(() => { try { popup.close() } catch (_) {} }, 1500)
  }

  // Fallback if onload doesn't fire (some browsers)
  setTimeout(() => {
    try {
      if (!popup.closed) {
        popup.focus()
        popup.print()
        setTimeout(() => { try { popup.close() } catch (_) {} }, 1500)
      }
    } catch (_) {}
  }, 800)
}
