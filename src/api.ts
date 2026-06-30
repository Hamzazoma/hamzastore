import { categories, defaultProducts } from './defaultData.ts'
import type { Category, Order, OrderStatus, Product } from './types.ts'

const API_URL = '/.netlify/functions/shop'
const PRODUCTS_KEY = 'fashion-store-products'
const ORDERS_KEY = 'fashion-store-orders'

const categoryList = categories as Category[]
const productSeed = defaultProducts as Product[]

function cloneProducts(products: Product[]) {
  return products.map((product) => ({
    ...product,
    sizes: [...product.sizes],
  }))
}

function readStorage<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function ensureLocalSeed() {
  const existingProducts = readStorage<Product[]>(PRODUCTS_KEY, [])

  if (!existingProducts.length) {
    writeStorage(PRODUCTS_KEY, cloneProducts(productSeed))
  }
}

async function tryApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'API request failed')
  }

  return (await response.json()) as T
}

export function getCategories() {
  return categoryList
}

export async function getProducts() {
  ensureLocalSeed()

  try {
    const result = await tryApi<{ products: Product[] }>('?entity=products')
    const products = result.products.length ? result.products : cloneProducts(productSeed)
    writeStorage(PRODUCTS_KEY, products)
    return products
  } catch {
    return readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
  }
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>) {
  ensureLocalSeed()

  const payload: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  try {
    const result = await tryApi<{ product: Product }>('?entity=products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    writeStorage(PRODUCTS_KEY, [result.product, ...cached.filter((item) => item.id !== result.product.id)])
    return result.product
  } catch {
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    const next = [payload, ...cached]
    writeStorage(PRODUCTS_KEY, next)
    return payload
  }
}

export async function getOrders() {
  try {
    const result = await tryApi<{ orders: Order[] }>('?entity=orders')
    writeStorage(ORDERS_KEY, result.orders)
    return result.orders
  } catch {
    return readStorage<Order[]>(ORDERS_KEY, [])
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>) {
  const payload: Order = {
    ...order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'جديد',
  }

  try {
    const result = await tryApi<{ order: Order }>('?entity=orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    writeStorage(ORDERS_KEY, [result.order, ...cached])
    return result.order
  } catch {
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    writeStorage(ORDERS_KEY, [payload, ...cached])
    return payload
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const result = await tryApi<{ order: Order }>(`?entity=orders&id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    writeStorage(
      ORDERS_KEY,
      cached.map((order) => (order.id === id ? result.order : order)),
    )
    return result.order
  } catch {
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    const next = cached.map((order) => (order.id === id ? { ...order, status } : order))
    writeStorage(ORDERS_KEY, next)
    return next.find((order) => order.id === id) ?? null
  }
}
