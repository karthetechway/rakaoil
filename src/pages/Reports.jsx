import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export default function Reports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [rows, setRows]   = useState([])
  const [loading, setLoading] = useState(false)
  const [topItems, setTopItems] = useState([])
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [year, mon] = month.split('-').map(Number)
      const start = startOfMonth(new Date(year, mon - 1))
      const end   = endOfMonth(new Date(year, mon - 1))

      const { data: bills, error } = await supabase
        .from('bills')
        .select('total, payment_mode, status, created_at, bill_items(product_name, size, quantity, line_total)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'paid')
      if (error) throw error

      // Daily aggregation
      const days = eachDayOfInterval({ start, end })
      const dayMap = {}
      days.forEach(d => { dayMap[format(d, 'yyyy-MM-dd')] = { date: d, total: 0, bills: 0, cash: 0, upi: 0, card: 0 } })

      bills.forEach(b => {
        const key = format(new Date(b.created_at), 'yyyy-MM-dd')
        if (dayMap[key]) {
          dayMap[key].total += Number(b.total)
          dayMap[key].bills += 1
          dayMap[key][b.payment_mode] = (dayMap[key][b.payment_mode] || 0) + Number(b.total)
        }
      })
      setRows(Object.values(dayMap).filter(d => d.bills > 0).reverse())

      // Top items
      const itemMap = {}
      bills.forEach(b => {
        (b.bill_items || []).forEach(i => {
          const key = `${i.product_name} ${i.size}`
          if (!itemMap[key]) itemMap[key] = { name: key, qty: 0, revenue: 0 }
          itemMap[key].qty += i.quantity
          itemMap[key].revenue += Number(i.line_total)
        })
      })
      setTopItems(Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10))

    } catch (e) {
      toast(e.message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [month])

  const grandTotal = rows.reduce((s, r) => s + r.total, 0)
  const grandBills = rows.reduce((s, r) => s + r.bills, 0)
  const grandCash  = rows.reduce((s, r) => s + r.cash, 0)
  const grandUpi   = rows.reduce((s, r) => s + r.upi, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports</h2>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }} />
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Month Revenue</div>
          <div className="stat-val">₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">{grandBills} bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cash</div>
          <div className="stat-val">₹{grandCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">UPI</div>
          <div className="stat-val">₹{grandUpi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Bill</div>
          <div className="stat-val">₹{grandBills ? Math.round(grandTotal / grandBills).toLocaleString('en-IN') : 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Daily breakdown */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
            Daily Sales
          </div>
          {loading
            ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Bills</th><th>Cash</th><th>UPI</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={format(r.date, 'yyyy-MM-dd')}>
                        <td>{format(r.date, 'dd MMM')}</td>
                        <td>{r.bills}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{r.cash.toFixed(0)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{r.upi.toFixed(0)}</td>
                        <td><strong>₹{r.total.toFixed(0)}</strong></td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No data for this month</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* Top products */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
            Top Products
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {topItems.map(i => (
                  <tr key={i.name}>
                    <td style={{ fontSize: 13 }}>{i.name}</td>
                    <td>{i.qty}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{i.revenue.toFixed(0)}</td>
                  </tr>
                ))}
                {topItems.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
