// Opens a tiny popup window, writes receipt HTML into it, and prints it.
// This completely sidesteps the React DOM / CSS media query conflicts.

import { SHOP } from '../constants/shop'

function buildReceiptHTML({ bill, items = [], customer, paymentMode, discount = 0, total }) {
  const safeTotal = typeof total === 'number' ? total : items.reduce((s, i) => s + i.line_total, 0)
  const safeSubtotal = items.reduce((s, i) => s + i.line_total, 0)
  const safeDiscount = Number(discount) || 0
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN') + ' ' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // GST Calculations
  const gstBreakdown = items.reduce((acc, i) => {
    const rate = parseFloat(i.gst_percent) || 0
    if (rate <= 0) return acc
    const totalLine = Number(i.line_total)
    const base = totalLine / (1 + rate / 100)
    const gst = totalLine - base
    acc.cgst += gst / 2
    acc.sgst += gst / 2
    return acc
  }, { cgst: 0, sgst: 0 })

  const itemRows = items.map((item, index) => `
    <div class="item">
      <div class="item-row">
        <span class="item-name">${item.product_name} — ${item.size}</span>
        <span class="item-amt">&#8377;${Number(item.line_total).toFixed(2)}</span>
      </div>
      <div class="item-sub">${item.quantity} pcs &times; &#8377;${Number(item.unit_price).toFixed(2)}</div>
    </div>
    ${index < items.length - 1 ? '<div class="dash" style="margin: 4px 0; border-top-style: dotted; opacity: 0.3;"></div>' : ''}
  `).join('')

  const discountRows = safeDiscount > 0 ? `
    <div class="tot-row"><span>Subtotal</span><span>&#8377;${safeSubtotal.toFixed(2)}</span></div>
    <div class="tot-row"><span>Discount</span><span>-&#8377;${safeDiscount.toFixed(2)}</span></div>
  ` : ''

  const gstRows = (gstBreakdown.cgst > 0 || gstBreakdown.sgst > 0) ? `
    <div class="tot-row"><span>CGST</span><span>&#8377;${gstBreakdown.cgst.toFixed(2)}</span></div>
    <div class="tot-row"><span>SGST</span><span>&#8377;${gstBreakdown.sgst.toFixed(2)}</span></div>
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
    <div class="shop-name">${SHOP.NAME}</div>
    ${SHOP.ADDRESS ? `<div>${SHOP.ADDRESS}</div>` : ''}
    ${SHOP.PHONE ? `<div>Ph: ${SHOP.PHONE}</div>` : ''}
    ${SHOP.EMAIL ? `<div>Email: ${SHOP.EMAIL}</div>` : ''}
    ${SHOP.GSTIN ? `<div>${SHOP.GSTIN}</div>` : ''}
  </div>

  <div class="dash"></div>

  <div class="meta">
    <div>Bill No : <strong>#${bill?.bill_number ?? '—'}</strong></div>
    <div>Date    : ${dateStr}</div>
    ${customer?.name ? `<div>Name    : ${customer.name}</div>` : ''}
    ${customer?.phone ? `<div>Phone   : ${customer.phone}</div>` : ''}
    <div>Payment : <strong>${(paymentMode || 'CASH').toUpperCase()}</strong></div>
  </div>

  <div class="dash"></div>

  <div class="items-header"><span>Item</span><span>Amt</span></div>

  ${itemRows}

  <div class="dash"></div>

  ${discountRows}
  ${gstRows}
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
    setTimeout(() => { try { popup.close() } catch (_) { } }, 1500)
  }

  // Fallback if onload doesn't fire (some browsers)
  setTimeout(() => {
    try {
      if (!popup.closed) {
        popup.focus()
        popup.print()
        setTimeout(() => { try { popup.close() } catch (_) { } }, 1500)
      }
    } catch (_) { }
  }, 800)
}
