import { categories, defaultProducts } from './defaultData.ts'
import type { Category, Order, OrderStatus, Product } from './types.ts'

const API_URL = '/.netlify/functions/shop'
const PRODUCTS_KEY = 'fashion-store-products'
const PRODUCTS_SEEDED_KEY = 'fashion-store-products-seeded'
const ORDERS_KEY = 'fashion-store-orders'
const FALLBACK_IMAGE = 'linear-gradient(135deg, #111827 0%, #334155 45%, #cbd5e1 100%)'

const categoryList = categories as Category[]
const productSeed = defaultProducts as Product[]

function isArabicText(value: string) {
  return /[\u0600-\u06FF]/.test(value)
}

function normalizeSize(size: string) {
  return size.trim().toUpperCase().replace('2XL', 'XXL')
}

function getSeedProduct(id?: string) {
  return productSeed.find((product) => product.id === id)
}

function normalizeProduct(input: Partial<Product>): Product {
  const seed = getSeedProduct(input.id)
  const sourceName = String(input.name ?? seed?.name ?? '').trim()
  const sourceDescription = String(input.description ?? seed?.description ?? '').trim()
  const sourceBadge = String(input.badge ?? seed?.badge ?? '').trim()

  const nameAr =
    input.nameAr?.trim() ||
    seed?.nameAr ||
    (isArabicText(sourceName) ? sourceName : String(seed?.nameAr ?? ''))
  const nameEn =
    input.nameEn?.trim() ||
    seed?.nameEn ||
    (!isArabicText(sourceName) ? sourceName : String(seed?.nameEn ?? ''))
  const descriptionAr =
    input.descriptionAr?.trim() ||
    seed?.descriptionAr ||
    (isArabicText(sourceDescription) ? sourceDescription : String(seed?.descriptionAr ?? sourceDescription))
  const descriptionEn =
    input.descriptionEn?.trim() ||
    seed?.descriptionEn ||
    (!isArabicText(sourceDescription) ? sourceDescription : String(seed?.descriptionEn ?? sourceDescription))
  const badgeAr =
    input.badgeAr?.trim() ||
    seed?.badgeAr ||
    (isArabicText(sourceBadge) ? sourceBadge : String(seed?.badgeAr ?? sourceBadge))
  const badgeEn =
    input.badgeEn?.trim() ||
    seed?.badgeEn ||
    (!isArabicText(sourceBadge) ? sourceBadge : String(seed?.badgeEn ?? sourceBadge))

  return {
    id: String(input.id ?? seed?.id ?? crypto.randomUUID()),
    name: sourceName || nameAr || nameEn,
    nameAr,
    nameEn,
    category: (input.category ?? seed?.category ?? 'men') as Product['category'],
    price: Number(input.price ?? seed?.price ?? 0),
    sizes: Array.from(
      new Set((input.sizes ?? seed?.sizes ?? []).map((size) => normalizeSize(String(size))).filter(Boolean)),
    ),
    description: sourceDescription || descriptionAr || descriptionEn,
    descriptionAr,
    descriptionEn,
    badge: sourceBadge || badgeAr || badgeEn,
    badgeAr,
    badgeEn,
    image: String(input.image ?? seed?.image ?? FALLBACK_IMAGE),
    createdAt: String(input.createdAt ?? seed?.createdAt ?? new Date().toISOString()),
  }
}

function normalizeOrderStatus(status: unknown): OrderStatus {
  const value = String(status ?? '').trim().toLowerCase()

  switch (value) {
    case 'new':
    case 'جديد':
      return 'new'
    case 'preparing':
    case 'قيد التجهيز':
      return 'preparing'
    case 'shipped':
    case 'تم الشحن':
      return 'shipped'
    case 'delivered':
    case 'تم التسليم':
      return 'delivered'
    default:
      return 'new'
  }
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          ...item,
          size: normalizeSize(String(item.size)),
          quantity: Number(item.quantity ?? 1),
          price: Number(item.price ?? 0),
        }))
      : [],
    total: Number(order.total ?? 0),
  }
}

function cloneProducts(products: Product[]) {
  return products.map((product) => normalizeProduct(product))
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
  const hasSeededBefore = localStorage.getItem(PRODUCTS_SEEDED_KEY) === 'true'
  const existingProducts = readStorage<Product[]>(PRODUCTS_KEY, [])

  if (!hasSeededBefore && !existingProducts.length) {
    writeStorage(PRODUCTS_KEY, cloneProducts(productSeed))
  }

  if (!hasSeededBefore) {
    localStorage.setItem(PRODUCTS_SEEDED_KEY, 'true')
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
    const products = result.products.map((product) => normalizeProduct(product))
    writeStorage(PRODUCTS_KEY, products)
    localStorage.setItem(PRODUCTS_SEEDED_KEY, 'true')
    return products
  } catch {
    return readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed)).map((product) =>
      normalizeProduct(product),
    )
  }
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt'>) {
  ensureLocalSeed()

  const payload = normalizeProduct({
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  })

  try {
    const result = await tryApi<{ product: Product }>('?entity=products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const saved = normalizeProduct(result.product)
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    writeStorage(PRODUCTS_KEY, [saved, ...cached.filter((item) => item.id !== saved.id)])
    localStorage.setItem(PRODUCTS_SEEDED_KEY, 'true')
    return saved
  } catch {
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    const next = [payload, ...cached]
    writeStorage(PRODUCTS_KEY, next)
    localStorage.setItem(PRODUCTS_SEEDED_KEY, 'true')
    return payload
  }
}

export async function updateProduct(id: string, product: Omit<Product, 'id' | 'createdAt'>) {
  ensureLocalSeed()

  const current = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed)).find(
    (item) => item.id === id,
  )
  const payload = normalizeProduct({
    ...current,
    ...product,
    id,
    createdAt: current?.createdAt ?? new Date().toISOString(),
  })

  try {
    const result = await tryApi<{ product: Product }>(`?entity=products&id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const saved = normalizeProduct(result.product)
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    writeStorage(
      PRODUCTS_KEY,
      cached.map((item) => (item.id === id ? saved : normalizeProduct(item))),
    )
    return saved
  } catch {
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    const next = cached.map((item) => (item.id === id ? payload : normalizeProduct(item)))
    writeStorage(PRODUCTS_KEY, next)
    return payload
  }
}

export async function deleteProduct(id: string) {
  ensureLocalSeed()

  try {
    await tryApi<{ deleted: boolean; id: string }>(`?entity=products&id=${id}`, {
      method: 'DELETE',
    })

    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    const next = cached.filter((product) => product.id !== id)
    writeStorage(PRODUCTS_KEY, next)
    return { deleted: true, id }
  } catch {
    const cached = readStorage<Product[]>(PRODUCTS_KEY, cloneProducts(productSeed))
    const next = cached.filter((product) => product.id !== id)
    writeStorage(PRODUCTS_KEY, next)
    return { deleted: true, id }
  }
}

export async function getOrders() {
  try {
    const result = await tryApi<{ orders: Order[] }>('?entity=orders')
    const orders = result.orders.map((order) => normalizeOrder(order))
    writeStorage(ORDERS_KEY, orders)
    return orders
  } catch {
    return readStorage<Order[]>(ORDERS_KEY, []).map((order) => normalizeOrder(order))
  }
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'>) {
  const payload: Order = {
    ...order,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'new',
  }

  try {
    const result = await tryApi<{ order: Order }>('?entity=orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    const saved = normalizeOrder(result.order)
    writeStorage(ORDERS_KEY, [saved, ...cached.map((entry) => normalizeOrder(entry))])
    return saved
  } catch {
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    writeStorage(ORDERS_KEY, [payload, ...cached.map((entry) => normalizeOrder(entry))])
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
    const saved = normalizeOrder(result.order)
    writeStorage(
      ORDERS_KEY,
      cached.map((order) => (order.id === id ? saved : normalizeOrder(order))),
    )
    return saved
  } catch {
    const cached = readStorage<Order[]>(ORDERS_KEY, [])
    const next = cached.map((order) =>
      order.id === id ? normalizeOrder({ ...order, status }) : normalizeOrder(order),
    )
    writeStorage(ORDERS_KEY, next)
    return next.find((order) => order.id === id) ?? null
  }
}
