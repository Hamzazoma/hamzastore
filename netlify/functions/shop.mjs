import { getStore } from '@netlify/blobs'
import { defaultProducts } from '../../shared/default-data.mjs'

const store = getStore('fashion-store')
const PRODUCTS_SEEDED_KEY = 'meta:products-seeded'

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers,
  })
}

async function listJson(prefix) {
  const listed = await store.list({ prefix })
  const blobs = listed.blobs ?? []
  const items = await Promise.all(
    blobs.map(async (blob) => {
      const entry = await store.get(blob.key, { type: 'json' })
      return entry
    }),
  )

  return items.filter(Boolean)
}

async function ensureSeedProducts() {
  const hasSeededBefore = await store.get(PRODUCTS_SEEDED_KEY, { type: 'json' })
  const existing = await listJson('product:')

  if (existing.length) {
    return existing
  }

  if (hasSeededBefore) {
    return []
  }

  await Promise.all(
    defaultProducts.map((product) =>
      store.setJSON(`product:${product.id}`, product),
    ),
  )
  await store.setJSON(PRODUCTS_SEEDED_KEY, true)

  return defaultProducts
}

async function getOrders() {
  const orders = await listJson('order:')
  return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

async function getProducts() {
  const products = await ensureSeedProducts()
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  const url = new URL(request.url)
  const entity = url.searchParams.get('entity')
  const id = url.searchParams.get('id')

  try {
    if (request.method === 'GET' && entity === 'products') {
      return json({ products: await getProducts() })
    }

    if (request.method === 'POST' && entity === 'products') {
      const product = await request.json()
      await store.setJSON(`product:${product.id}`, product)
      await store.setJSON(PRODUCTS_SEEDED_KEY, true)
      return json({ product }, 201)
    }

    if (request.method === 'DELETE' && entity === 'products' && id) {
      const currentProduct = await store.get(`product:${id}`, { type: 'json' })

      if (!currentProduct) {
        return json({ message: 'المنتج غير موجود.' }, 404)
      }

      await store.delete(`product:${id}`)
      await store.setJSON(PRODUCTS_SEEDED_KEY, true)
      return json({ deleted: true, id })
    }

    if (request.method === 'GET' && entity === 'orders') {
      return json({ orders: await getOrders() })
    }

    if (request.method === 'POST' && entity === 'orders') {
      const order = await request.json()
      await store.setJSON(`order:${order.id}`, order)
      return json({ order }, 201)
    }

    if (request.method === 'PATCH' && entity === 'orders' && id) {
      const payload = await request.json()
      const currentOrder = await store.get(`order:${id}`, { type: 'json' })

      if (!currentOrder) {
        return json({ message: 'الطلب غير موجود.' }, 404)
      }

      const updatedOrder = {
        ...currentOrder,
        ...payload,
      }

      await store.setJSON(`order:${id}`, updatedOrder)
      return json({ order: updatedOrder })
    }

    return json({ message: 'المسار غير مدعوم.' }, 404)
  } catch (error) {
    return json(
      {
        message: error instanceof Error ? error.message : 'خطأ غير متوقع',
      },
      500,
    )
  }
}
