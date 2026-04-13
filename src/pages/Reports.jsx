import { useEffect, useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { SHOP } from '../constants/shop'

export default function Reports() {
  // Filtering state
  const [filterMode, setFilterMode] = useState('monthly') // 'monthly' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })

  // Data state
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      let start, end
      if (filterMode === 'monthly') {
        const [year, mon] = selectedMonth.split('-').map(Number)
        start = startOfMonth(new Date(year, mon - 1))
        end = endOfMonth(new Date(year, mon - 1))
      } else {
        start = startOfDay(new Date(dateRange.start))
        end = endOfDay(new Date(dateRange.end))
      }

      const { data, error } = await supabase
        .from('bills')
        .select(`
          id, bill_number, created_at, subtotal, discount, total, payment_mode, status,
          customers(name, phone),
          bill_items(product_name, size, quantity, line_total)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBills(data || [])
    } catch (e) {
      toast(e.message, 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [filterMode, selectedMonth, dateRange])

  // ── Calculated Stats ───────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = bills.reduce((s, b) => s + Number(b.total), 0)
    const cash = bills.filter(b => b.payment_mode === 'cash').reduce((s, b) => s + Number(b.total), 0)
    const upi = bills.filter(b => b.payment_mode === 'upi').reduce((s, b) => s + Number(b.total), 0)
    const card = bills.filter(b => b.payment_mode === 'card').reduce((s, b) => s + Number(b.total), 0)
    const totalDiscount = bills.reduce((s, b) => s + Number(b.discount || 0), 0)

    // Daily breakdown for table
    const daily = bills.reduce((acc, b) => {
      const day = format(new Date(b.created_at), 'yyyy-MM-dd')
      if (!acc[day]) acc[day] = { date: day, total: 0, bills: 0, cash: 0, upi: 0, card: 0 }
      acc[day].total += Number(b.total)
      acc[day].bills += 1
      acc[day][b.payment_mode] += Number(b.total)
      return acc
    }, {})

    // Top items
    const items = {}
    bills.forEach(b => {
      (b.bill_items || []).forEach(i => {
        const key = `${i.product_name} ${i.size}`
        if (!items[key]) items[key] = { name: key, qty: 0, revenue: 0 }
        items[key].qty += i.quantity
        items[key].revenue += Number(i.line_total)
      })
    })

    return {
      totalRevenue,
      cash,
      upi,
      card,
      totalDiscount,
      daily: Object.values(daily).sort((a, b) => b.date.localeCompare(a.date)),
      topItems: Object.values(items).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    }
  }, [bills])

  // ── Handlers ───────────────────────────────────────────────
  const downloadCSV = () => {
    if (bills.length === 0) return toast('No data to download', 'info')
    
    const headers = ['Bill No', 'Date', 'Customer', 'Phone', 'Mode', 'Subtotal', 'Discount', 'Total']
    const csvContent = [
      headers.join(','),
      ...bills.map(b => [
        `#${b.bill_number}`,
        format(new Date(b.created_at), 'dd/MM/yyyy'),
        `"${b.customers?.name || 'Walk-in'}"`,
        `'${b.customers?.phone || ''}`,
        b.payment_mode.toUpperCase(),
        b.subtotal,
        b.discount || 0,
        b.total
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Sales_Report_${filterMode === 'monthly' ? selectedMonth : 'Custom'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="page">
      {/* ── Print Content (Hidden in UI) ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; color: #000; }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          h2, h3 { color: #000; margin-bottom: 5px; }
          .print-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        }
      `}</style>
      
      <div id="printable-report" style={{ display: 'none' }}>
        <div className="print-header">
          <h2>{SHOP.NAME} - Sales Report</h2>
          <p>{SHOP.ADDRESS}</p>
          <p>Period: {filterMode === 'monthly' ? format(new Date(selectedMonth), 'MMMM yyyy') : `${dateRange.start} to ${dateRange.end}`}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div><strong>Total Revenue:</strong> ₹{stats.totalRevenue.toFixed(2)}</div>
          <div><strong>Total Bills:</strong> {bills.length}</div>
          <div><strong>Payment:</strong> Cash: ₹{stats.cash.toFixed(0)} | UPI: ₹{stats.upi.toFixed(0)}</div>
        </div>

        <h3>Individual Bills List</h3>
        <table>
          <thead>
            <tr>
              <th>Bill #</th><th>Date</th><th>Customer</th><th>Mode</th><th>Items</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id}>
                <td>#{b.bill_number}</td>
                <td>{format(new Date(b.created_at), 'dd/MM/yy HH:mm')}</td>
                <td>{b.customers?.name || 'Walk-in'}</td>
                <td>{b.payment_mode.toUpperCase()}</td>
                <td style={{ fontSize: 9 }}>
                  {b.bill_items.map(i => `${i.product_name} (${i.quantity})`).join(', ')}
                </td>
                <td>₹{Number(b.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── UI Logic ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Sales Reports</h2>
        <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={downloadCSV}>📥 Download CSV</button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨️ Print Report</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <div className="btn-group">
                <button className={`btn btn-sm ${filterMode === 'monthly' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterMode('monthly')}>Monthly</button>
                <button className={`btn btn-sm ${filterMode === 'custom' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterMode('custom')}>Custom Range</button>
            </div>

            {filterMode === 'monthly' ? (
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: 180 }} />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ width: 150 }} />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ width: 150 }} />
                </div>
            )}
            
            <button className="btn btn-icon" onClick={loadData} title="Refresh">🔄</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-val">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">{bills.length} bills total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cash Payments</div>
          <div className="stat-val">₹{stats.cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">Physical collections</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Digital (UPI/Card)</div>
          <div className="stat-val">₹{(stats.upi + stats.card).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">Bank transfers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Discount</div>
          <div className="stat-val" style={{ color: 'var(--red)' }}>₹{stats.totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-sub">Total savings provided</div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
             Daily Summary
          </div>
          <div className="table-wrap">
            {loading ? <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div> : (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Bills</th><th>Cash</th><th>Digital</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {stats.daily.map(r => (
                      <tr key={r.date}>
                        <td>{format(new Date(r.date), 'dd MMM yyyy')}</td>
                        <td>{r.bills}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{r.cash.toFixed(0)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{(r.upi + r.card).toFixed(0)}</td>
                        <td><strong>₹{r.total.toFixed(0)}</strong></td>
                      </tr>
                    ))}
                    {stats.daily.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No data found</td></tr>
                    )}
                  </tbody>
                </table>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
            Top Products (Revenue)
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {stats.topItems.map(i => (
                  <tr key={i.name}>
                    <td style={{ fontSize: 13 }}>{i.name}</td>
                    <td>{i.qty}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>₹{i.revenue.toFixed(0)}</td>
                  </tr>
                ))}
                {stats.topItems.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No products sold</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Individual Bills List (Visible in UI for quick check) */}
      <div className="card" style={{ marginTop: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Detailed Bills List</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Latest {bills.length} bills</span>
          </div>
          <div className="table-wrap">
              <table>
                  <thead style={{ background: 'var(--cream-light)' }}>
                      <tr><th>Bill #</th><th>Date</th><th>Customer</th><th>Mode</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                      {bills.slice(0, 100).map(b => (
                          <tr key={b.id}>
                              <td>#{b.bill_number}</td>
                              <td>{format(new Date(b.created_at), 'dd MMM, hh:mm a')}</td>
                              <td>{b.customers?.name || 'Walk-in'}</td>
                              <td style={{ textTransform: 'uppercase', fontSize: 11 }}>{b.payment_mode}</td>
                              <td style={{ fontWeight: 600 }}>₹{Number(b.total).toFixed(2)}</td>
                          </tr>
                      ))}
                      {bills.length > 100 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: 12 }}>Showing first 100 bills. Use CSV export for full list.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  )
}
