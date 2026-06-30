export type CategoryId =
  | 'world-cup'
  | 'men'
  | 'women'
  | 'girls'
  | 'kids'
  | 'shoes'

export interface Category {
  id: CategoryId
  name: string
  subtitle: string
  accent: string
  badge: string
}

export interface Product {
  id: string
  name: string
  nameAr?: string
  nameEn?: string
  category: CategoryId
  price: number
  sizes: string[]
  description: string
  descriptionAr?: string
  descriptionEn?: string
  badge?: string
  badgeAr?: string
  badgeEn?: string
  image: string
  createdAt: string
}

export interface CartItem {
  productId: string
  size: string
  quantity: number
}

export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered'

export interface OrderItem {
  productId: string
  name: string
  price: number
  size: string
  quantity: number
}

export interface Order {
  id: string
  customerName: string
  phone: string
  address: string
  notes: string
  status: OrderStatus
  total: number
  items: OrderItem[]
  createdAt: string
}
