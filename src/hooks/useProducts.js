import { useEffect, useState } from 'react'
import { fetchProducts, supabase } from '../lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Realtime: refresh products when any product changes
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return { products, loading, error, reload: load }
}
