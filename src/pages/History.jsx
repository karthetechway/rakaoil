import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { fetchBills, cancelBill } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function History() {
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [expanded, setExpanded] = useState(null)
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

  const handleCancel = async (id, billNo) => {
    if (!window.confirm(`Cancel Bill #${billNo}?`)) return
    try {
      await cancelBill(id)
      toast(`Bill #${billNo} cancelled`)
      load()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const paidBills      = bills.filter(b => b.status === 'paid')
  const cancelledBills = bills.filter(b => b.status === 'cancelled')
  const dayTotal       = paidBills.reduce((s, b) => s + Number(b.total), 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Bill History</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button className="btn btn-outline btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: '1.25rem' }}>
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <React.Fragment key={b.id}>
                    <tr
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    >
                      <td><strong>#{b.bill_number}</strong></td>
                      <td>{format(new Date(b.created_at), 'hh:mm a')}</td>
                      <td>{b.customers?.name || b.customers?.phone || '—'}</td>
                      <td>{b.bill_items?.length ?? 0} items</td>
                      <td><span className="badge badge-gold">{b.payment_mode.toUpperCase()}</span></td>
                      <td><strong>₹{Number(b.total).toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge ${b.status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === 'paid' && (
                          <button
                            className="btn-ghost btn btn-sm"
                            onClick={e => { e.stopPropagation(); handleCancel(b.id, b.bill_number) }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>

                    {expanded === b.id && (
                      <tr>
                        <td colSpan={8} style={{ background: 'var(--cream)', padding: '0 1rem 1rem' }}>
                          <table style={{ marginTop: 8 }}>
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Size</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(b.bill_items || []).map(i => (
                                <tr key={i.id}>
                                  <td>{i.product_name}</td>
                                  <td>{i.size}</td>
                                  <td>{i.quantity}</td>
                                  <td>₹{i.unit_price}</td>
                                  <td>₹{i.line_total}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {b.discount > 0 && (
                            <div style={{ textAlign: 'right', marginTop: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                              Discount: ₹{b.discount} | Total Paid: ₹{b.total}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
