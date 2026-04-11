import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Auth helpers ──────────────────────────────────────────────
export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Products ─────────────────────────────────────────────────
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data
}

export const updateProductPrice = async (id, price) => {
  const { error } = await supabase
    .from('products')
    .update({ price })
    .eq('id', id)
  if (error) throw error
}

// ── Customers ─────────────────────────────────────────────────
export const findOrCreateCustomer = async ({ name, phone }) => {
  if (!phone) return null
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone })
    .select()
    .single()
  if (error) throw error
  return data
}

export const fetchCustomers = async (search = '') => {
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false })
  if (search) query = query.ilike('phone', `%${search}%`)
  const { data, error } = await query.limit(10)
  if (error) throw error
  return data
}

// ── Bills ─────────────────────────────────────────────────────
export const saveBill = async ({ items, customer, paymentMode, discount = 0, notes = '' }) => {
  const subtotal = items.reduce((s, i) => s + i.line_total, 0)
  const total = Math.max(0, subtotal - discount)

  // Find or create customer
  let customerId = null
  if (customer?.phone) {
    const c = await findOrCreateCustomer(customer)
    customerId = c?.id ?? null
  }

  // Insert bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({ customer_id: customerId, subtotal, discount, total, payment_mode: paymentMode, notes })
    .select()
    .single()
  if (billError) throw billError

  // Insert bill items
  const { error: itemsError } = await supabase.from('bill_items').insert(
    items.map(i => ({
      bill_id: bill.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: i.line_total
    }))
  )
  if (itemsError) throw itemsError

  return bill
}

export const fetchBills = async ({ date, limit = 50 } = {}) => {
  let query = supabase
    .from('bills')
    .select(`*, customers(name, phone), bill_items(*)`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (date) {
    const start = new Date(date); start.setHours(0, 0, 0, 0)
    const end = new Date(date); end.setHours(23, 59, 59, 999)
    query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const fetchDailySummary = async (date = new Date()) => {
  const start = new Date(date); start.setHours(0, 0, 0, 0)
  const end = new Date(date); end.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('bills')
    .select('total, payment_mode, status')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .eq('status', 'paid')
  if (error) throw error

  return {
    totalSales: data.reduce((s, b) => s + Number(b.total), 0),
    billCount: data.length,
    cash: data.filter(b => b.payment_mode === 'cash').reduce((s, b) => s + Number(b.total), 0),
    upi: data.filter(b => b.payment_mode === 'upi').reduce((s, b) => s + Number(b.total), 0),
    card: data.filter(b => b.payment_mode === 'card').reduce((s, b) => s + Number(b.total), 0),
  }
}

export const cancelBill = async (id) => {
  const { error } = await supabase.from('bills').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
