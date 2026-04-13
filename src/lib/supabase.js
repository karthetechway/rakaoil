import { createClient } from '@supabase/supabase-js'

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } },
  global: {
    // Never log responses in production (prevents leaking PII to browser console)
    fetch: (...args) => fetch(...args),
  }
})

// ── Auth ──────────────────────────────────────────────────────
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Input sanitisation helpers ────────────────────────────────
// Strip HTML tags and dangerous characters from text fields
const sanitiseText = (v) =>
  String(v ?? '').replace(/[<>"'`]/g, '').trim().slice(0, 200)

// Ensure a value is a safe positive number within bounds
const sanitisePrice = (v) => {
  const n = parseFloat(v)
  if (isNaN(n) || n <= 0 || n > 99999) throw new Error('Invalid price value')
  return Math.round(n * 100) / 100   // cap to 2 decimal places
}

const sanitiseQty = (v) => {
  const n = parseInt(v, 10)
  if (isNaN(n) || n <= 0 || n > 9999) throw new Error('Invalid quantity')
  return n
}

const sanitisePhone = (v) => {
  const digits = String(v ?? '').replace(/\D/g, '').slice(0, 15)
  if (digits.length < 10) throw new Error('Phone must be at least 10 digits')
  return digits
}

// ── Products ──────────────────────────────────────────────────
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, name_tamil, category, size, unit, price, active, sort_order, gst_percent')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data
}

export const fetchAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, name_tamil, category, size, unit, price, active, sort_order, gst_percent')
    .order('sort_order')
  if (error) throw error
  return data
}

export const updateProductPrice = async (id, price) => {
  const safePrice = sanitisePrice(price)
  if (!id || typeof id !== 'string') throw new Error('Invalid product ID')
  const { error } = await supabase
    .from('products')
    .update({ price: safePrice })
    .eq('id', id)
  if (error) throw error
}

// ── Customers ─────────────────────────────────────────────────
export const findOrCreateCustomer = async ({ name, phone }) => {
  if (!phone) return null

  const safePhone = sanitisePhone(phone)
  const safeName  = sanitiseText(name || 'Customer')

  const { data: existing } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count, total_spent')
    .eq('phone', safePhone)
    .maybeSingle()

  if (existing) {
    // Update name if it changed
    if (safeName && safeName !== existing.name) {
      await supabase.from('customers').update({ name: safeName }).eq('id', existing.id)
    }
    return existing
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({ name: safeName, phone: safePhone })
    .select('id, name, phone, visit_count, total_spent')
    .single()
  if (error) throw error
  return data
}

export const fetchCustomers = async (search = '') => {
  const safeSearch = sanitisePhone(search).slice(0, 15)
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, visit_count, total_spent')
    .ilike('phone', `%${safeSearch}%`)
    .order('created_at', { ascending: false })
    .limit(5)           // reduced from 10 — only need best match
  if (error) throw error
  return data
}

// ── Bills ─────────────────────────────────────────────────────
export const saveBill = async ({ items, customer, paymentMode, discount = 0, notes = '' }) => {
  // --- Validate all inputs before touching the DB ---
  if (!Array.isArray(items) || items.length === 0) throw new Error('No items in bill')

  const ALLOWED_PAYMENT_MODES = ['cash', 'upi', 'card']
  if (!ALLOWED_PAYMENT_MODES.includes(paymentMode))
    throw new Error('Invalid payment mode')

  const safeDiscount = Math.max(0, parseFloat(discount) || 0)
  const safeNotes    = sanitiseText(notes).slice(0, 500)

  // Validate & sanitise each item
  const safeItems = items.map((i, idx) => {
    if (!i.product_name) throw new Error(`Item ${idx + 1}: missing product name`)
    
    // GST calculation (Price is inclusive)
    const priceInclusive = sanitisePrice(i.unit_price)
    const gstPercent     = Math.max(0, parseFloat(i.gst_percent) || 0)
    const basePrice      = priceInclusive / (1 + gstPercent / 100)
    const gstAmountPer   = priceInclusive - basePrice
    const lineTotal      = priceInclusive * sanitiseQty(i.quantity)

    return {
      product_id:   i.product_id  || null,
      product_name: sanitiseText(i.product_name),
      size:         sanitiseText(i.size),
      quantity:     sanitiseQty(i.quantity),
      unit_price:   priceInclusive,
      line_total:   sanitisePrice(lineTotal),
      gst_percent:  gstPercent,
      gst_amount:   Math.round(gstAmountPer * i.quantity * 100) / 100
    }
  })

  // Server-side total recalculation (don't trust client total)
  const subtotal = safeItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const total    = Math.max(0, Math.round((subtotal - safeDiscount) * 100) / 100)

  // Customer
  let customerId = null
  if (customer?.phone) {
    try {
      const c = await findOrCreateCustomer(customer)
      customerId = c?.id ?? null
    } catch (_) {
      // Non-fatal: save bill without customer link if phone is bad
    }
  }

  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      customer_id:  customerId,
      subtotal:     Math.round(subtotal * 100) / 100,
      discount:     safeDiscount,
      total,
      payment_mode: paymentMode,
      notes:        safeNotes,
    })
    .select('id, bill_number, created_at')
    .single()
  if (billError) throw billError

  const { error: itemsError } = await supabase
    .from('bill_items')
    .insert(safeItems.map(i => ({ bill_id: bill.id, ...i })))
  if (itemsError) throw itemsError

  return bill
}

export const fetchBills = async ({ date, limit = 50 } = {}) => {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200)

  let query = supabase
    .from('bills')
    .select('id, bill_number, created_at, subtotal, discount, total, payment_mode, status, notes, customers(name, phone), bill_items(*)')
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (date) {
    const d = new Date(date)
    if (isNaN(d.getTime())) throw new Error('Invalid date')
    const start = new Date(d); start.setHours(0, 0, 0, 0)
    const end   = new Date(d); end.setHours(23, 59, 59, 999)
    query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const fetchDailySummary = async (date = new Date()) => {
  const d = new Date(date)
  if (isNaN(d.getTime())) throw new Error('Invalid date')
  const start = new Date(d); start.setHours(0, 0, 0, 0)
  const end   = new Date(d); end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('bills')
    .select('total, payment_mode')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .eq('status', 'paid')
  if (error) throw error

  return {
    totalSales: data.reduce((s, b) => s + Number(b.total), 0),
    billCount:  data.length,
    cash: data.filter(b => b.payment_mode === 'cash').reduce((s, b) => s + Number(b.total), 0),
    upi:  data.filter(b => b.payment_mode === 'upi').reduce((s, b)  => s + Number(b.total), 0),
    card: data.filter(b => b.payment_mode === 'card').reduce((s, b) => s + Number(b.total), 0),
  }
}

export const cancelBill = async (id) => {
  if (!id || typeof id !== 'string') throw new Error('Invalid bill ID')
  const { error } = await supabase
    .from('bills')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw error
}

// ── Stock ─────────────────────────────────────────────────────
export const fetchStockEntries = async (productId = null) => {
  let query = supabase
    .from('stock_entries')
    .select('*, products(name, size)')
    .order('created_at', { ascending: false })

  if (productId) {
    query = query.eq('product_id', productId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const addStockEntry = async ({ product_id, quantity, type = 'in', remarks = '' }) => {
  const { data, error } = await supabase
    .from('stock_entries')
    .insert({
      product_id,
      quantity: parseFloat(quantity),
      type,
      remarks: sanitiseText(remarks),
    })
    .select()
    .single()
  
  if (error) throw error

  // Optional: Update products table if it has a stock column
  // (We'll assume for now we just log entries)
  
  return data
}
