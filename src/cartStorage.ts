import type { CartItem } from './types.ts'

const CART_KEY = 'fashion-store-cart'

export function readCart() {
  const raw = localStorage.getItem(CART_KEY)

  if (!raw) {
    return [] as CartItem[]
  }

  try {
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}
