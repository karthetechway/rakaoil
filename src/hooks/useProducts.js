import { useEffect, useState } from 'react'
import { fetchProducts, fetchAllProducts, supabase } from '../lib/supabase'

// showAll=false → only active products (billing screen)
// showAll=true  → all products including hidden (products admin page)
export function useProducts({ showAll = false } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const load = async () => {
    try {
      const data = showAll ? await fetchAllProducts() : await fetchProducts()
      setProducts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [showAll])

  return { products, loading, error, reload: load }
}
