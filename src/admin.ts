import './admin.css'
import { addProduct, getCategories, getOrders, getProducts, updateOrderStatus } from './api.ts'
import type { Order, OrderStatus, Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Admin app root was not found')
}

const appRoot = app
const categories = getCategories()
const orderStatuses: OrderStatus[] = ['جديد', 'قيد التجهيز', 'تم الشحن', 'تم التسليم']

const state: {
  orders: Order[]
  products: Product[]
  message: string
  loading: boolean
} = {
  orders: [],
  products: [],
  message: '',
  loading: true,
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function render() {
  const totalOrders = state.orders.length
  const pendingOrders = state.orders.filter((order) => order.status !== 'تم التسليم').length
  const totalSales = state.orders.reduce((sum, order) => sum + order.total, 0)

  appRoot.innerHTML = `
    <div class="admin-shell">
      <header class="admin-hero">
        <div>
          <span class="eyebrow">لوحة الإدارة</span>
          <h1>متابعة الطلبات والمنتجات</h1>
          <p>التحديث التلقائي للطلبات يعمل كل 10 ثوانٍ، ويمكنك إضافة أي منتج جديد مع صورة وسعر ومقاسات واختيار القسم.</p>
        </div>
        <div class="admin-hero__actions">
          <a href="index.html">الرجوع للمتجر</a>
          <button id="manual-refresh">تحديث الآن</button>
        </div>
      </header>

      <section class="stats-grid">
        <article class="stat-card">
          <small>إجمالي الطلبات</small>
          <strong>${totalOrders}</strong>
        </article>
        <article class="stat-card">
          <small>طلبات قيد المتابعة</small>
          <strong>${pendingOrders}</strong>
        </article>
        <article class="stat-card">
          <small>إجمالي المبيعات</small>
          <strong>${formatPrice(totalSales)}</strong>
        </article>
      </section>

      <main class="admin-layout">
        <section class="admin-panel">
          <div class="section-head">
            <div>
              <span class="eyebrow">الطلبات</span>
              <h2>آخر الطلبات</h2>
            </div>
            <small>${state.loading ? 'جارٍ التحديث...' : 'تحديث تلقائي كل 10 ثوانٍ'}</small>
          </div>

          <div class="orders-list">
            ${
              state.orders.length
                ? state.orders
                    .map(
                      (order) => `
                        <article class="order-card">
                          <div class="order-card__top">
                            <div>
                              <strong>${order.customerName}</strong>
                              <p>${order.phone}</p>
                            </div>
                            <div class="order-card__meta">
                              <span>${formatPrice(order.total)}</span>
                              <small>${formatDate(order.createdAt)}</small>
                            </div>
                          </div>
                          <p class="order-address">${order.address}</p>
                          <div class="order-items">
                            ${order.items
                              .map(
                                (item) => `
                                  <span>${item.name} / ${item.size} × ${item.quantity}</span>
                                `,
                              )
                              .join('')}
                          </div>
                          <div class="order-footer">
                            <label>
                              <span>حالة الطلب</span>
                              <select data-order-id="${order.id}">
                                ${orderStatuses
                                  .map(
                                    (status) => `
                                      <option value="${status}" ${order.status === status ? 'selected' : ''}>
                                        ${status}
                                      </option>
                                    `,
                                  )
                                  .join('')}
                              </select>
                            </label>
                            <small>${order.notes || 'لا توجد ملاحظات'}</small>
                          </div>
                        </article>
                      `,
                    )
                    .join('')
                : '<p class="empty-state">لا توجد طلبات حتى الآن.</p>'
            }
          </div>
        </section>

        <section class="admin-side">
          <section class="admin-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">إضافة منتج</span>
                <h2>منتج جديد</h2>
              </div>
            </div>

            <form id="product-form" class="product-form">
              <label>
                <span>اسم المنتج</span>
                <input name="name" placeholder="مثال: طقم فرنسا الأساسي" required />
              </label>
              <label>
                <span>السعر</span>
                <input name="price" type="number" min="1" placeholder="999" required />
              </label>
              <label>
                <span>القسم</span>
                <select name="category" required>
                  ${categories
                    .map((category) => `<option value="${category.id}">${category.name}</option>`)
                    .join('')}
                </select>
              </label>
              <label>
                <span>الوصف</span>
                <textarea name="description" placeholder="وصف مختصر للمنتج" required></textarea>
              </label>
              <label>
                <span>المقاسات</span>
                <input name="sizes" placeholder="مثال: S,M,L,XL أو 39,40,41" required />
              </label>
              <label>
                <span>الصورة</span>
                <input name="imageFile" type="file" accept="image/*" />
              </label>
              <label>
                <span>نص الشارة</span>
                <input name="badge" placeholder="مثال: جديد" />
              </label>
              <button type="submit">إضافة المنتج</button>
            </form>
            ${state.message ? `<p class="admin-message">${state.message}</p>` : ''}
          </section>

          <section class="admin-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">المنتجات الحالية</span>
                <h2>آخر المنتجات</h2>
              </div>
            </div>
            <div class="mini-products">
              ${state.products
                .slice(0, 6)
                .map(
                  (product) => `
                    <article class="mini-product">
                      <div class="mini-product__image" style="background:${product.image}"></div>
                      <div>
                        <strong>${product.name}</strong>
                        <p>${categories.find((category) => category.id === product.category)?.name ?? ''} · ${formatPrice(product.price)}</p>
                      </div>
                    </article>
                  `,
                )
                .join('')}
            </div>
          </section>
        </section>
      </main>
    </div>
  `

  document.querySelector('#manual-refresh')?.addEventListener('click', async () => {
    await refreshDashboard()
  })

  document.querySelectorAll<HTMLSelectElement>('[data-order-id]').forEach((select) => {
    select.addEventListener('change', async () => {
      const orderId = select.dataset.orderId
      const status = select.value as OrderStatus
      if (!orderId) return

      await updateOrderStatus(orderId, status)
      state.message = `تم تحديث الطلب إلى حالة: ${status}`
      await refreshDashboard(false)
    })
  })

  document.querySelector('#product-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const file = formData.get('imageFile') as File | null
    let imageValue =
      'linear-gradient(135deg, #111827 0%, #334155 45%, #cbd5e1 100%)'

    if (file && file.size) {
      imageValue = await readFileAsDataUrl(file)
    }

    await addProduct({
      name: String(formData.get('name') ?? '').trim(),
      category: String(formData.get('category') ?? 'men') as Product['category'],
      price: Number(formData.get('price') ?? 0),
      description: String(formData.get('description') ?? '').trim(),
      sizes: String(formData.get('sizes') ?? '')
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean),
      badge: String(formData.get('badge') ?? '').trim() || 'منتج جديد',
      image: imageValue,
    })

    form.reset()
    state.message = 'تمت إضافة المنتج بنجاح وسيظهر في المتجر مباشرة.'
    await refreshDashboard(false)
  })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function refreshDashboard(showLoading = true) {
  if (showLoading) {
    state.loading = true
    render()
  }

  state.orders = await getOrders()
  state.products = await getProducts()
  state.loading = false
  render()
}

refreshDashboard()
window.setInterval(() => {
  void refreshDashboard(false)
}, 10000)
