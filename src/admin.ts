import './admin.css'
import {
  addProduct,
  deleteProduct,
  getCategories,
  getOrders,
  getProducts,
  updateOrderStatus,
} from './api.ts'
import type { Order, OrderStatus, Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Admin app root was not found')
}

const appRoot = app
const categories = getCategories()
const orderStatuses: OrderStatus[] = ['جديد', 'قيد التجهيز', 'تم الشحن', 'تم التسليم']
const AUTO_REFRESH_INTERVAL_MS = 10000
const FORM_IDLE_RESUME_MS = 1800
const FALLBACK_PRODUCT_IMAGE =
  'linear-gradient(135deg, #111827 0%, #334155 45%, #cbd5e1 100%)'

const state: {
  orders: Order[]
  products: Product[]
  message: string
  loading: boolean
  submittingProduct: boolean
} = {
  orders: [],
  products: [],
  message: '',
  loading: true,
  submittingProduct: false,
}

const formRefreshState = {
  pausedUntil: 0,
  timerId: 0 as number | undefined,
}

let statsGrid: HTMLDivElement | null = null
let ordersList: HTMLDivElement | null = null
let productsList: HTMLDivElement | null = null
let adminMessage: HTMLParagraphElement | null = null
let refreshStatus: HTMLElement | null = null
let productForm: HTMLFormElement | null = null
let manualRefreshButton: HTMLButtonElement | null = null

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

function isRefreshPaused() {
  return state.submittingProduct || Date.now() < formRefreshState.pausedUntil
}

function clearFormPauseTimer() {
  if (formRefreshState.timerId) {
    window.clearTimeout(formRefreshState.timerId)
    formRefreshState.timerId = undefined
  }
}

function scheduleRefreshResume() {
  clearFormPauseTimer()
  const remainingMs = Math.max(formRefreshState.pausedUntil - Date.now(), 0)

  formRefreshState.timerId = window.setTimeout(() => {
    formRefreshState.pausedUntil = 0
    renderRefreshStatus()
    void refreshDashboard(false)
  }, remainingMs + 20)
}

function markFormInteraction(duration = FORM_IDLE_RESUME_MS) {
  if (!productForm) {
    return
  }

  formRefreshState.pausedUntil = Date.now() + duration
  renderRefreshStatus()
  scheduleRefreshResume()
}

function resetFormPause() {
  formRefreshState.pausedUntil = 0
  clearFormPauseTimer()
  renderRefreshStatus()
}

function renderShell() {
  appRoot.innerHTML = `
    <div class="admin-shell">
      <header class="admin-hero">
        <div>
          <span class="eyebrow">لوحة الإدارة</span>
          <h1>متابعة الطلبات والمنتجات</h1>
          <p>التحديث التلقائي للطلبات يعمل كل 10 ثوانٍ، ويتوقف مؤقتًا أثناء الكتابة داخل نموذج إضافة المنتج حتى لا تفقد أي بيانات.</p>
        </div>
        <div class="admin-hero__actions">
          <a href="index.html">الرجوع للمتجر</a>
          <button id="manual-refresh" type="button">تحديث الآن</button>
        </div>
      </header>

      <section id="stats-grid" class="stats-grid"></section>

      <main class="admin-layout">
        <section class="admin-panel">
          <div class="section-head">
            <div>
              <span class="eyebrow">الطلبات</span>
              <h2>آخر الطلبات</h2>
            </div>
            <small id="refresh-status"></small>
          </div>

          <div id="orders-list" class="orders-list"></div>
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
            <p id="admin-message" class="admin-message" hidden></p>
          </section>

          <section class="admin-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">المنتجات الحالية</span>
                <h2>كل المنتجات</h2>
              </div>
            </div>
            <div id="products-list" class="mini-products"></div>
          </section>
        </section>
      </main>
    </div>
  `

  statsGrid = document.querySelector<HTMLDivElement>('#stats-grid')
  ordersList = document.querySelector<HTMLDivElement>('#orders-list')
  productsList = document.querySelector<HTMLDivElement>('#products-list')
  adminMessage = document.querySelector<HTMLParagraphElement>('#admin-message')
  refreshStatus = document.querySelector<HTMLElement>('#refresh-status')
  productForm = document.querySelector<HTMLFormElement>('#product-form')
  manualRefreshButton = document.querySelector<HTMLButtonElement>('#manual-refresh')

  bindEvents()
  renderAll()
}

function bindEvents() {
  manualRefreshButton?.addEventListener('click', async () => {
    resetFormPause()
    await refreshDashboard(true, true)
  })

  ordersList?.addEventListener('change', async (event) => {
    const target = event.target

    if (!(target instanceof HTMLSelectElement)) {
      return
    }

    const orderId = target.dataset.orderId
    const status = target.value as OrderStatus

    if (!orderId) {
      return
    }

    await updateOrderStatus(orderId, status)
    state.message = `تم تحديث الطلب إلى حالة: ${status}`
    renderMessage()
    await refreshDashboard(false, true)
  })

  productForm?.addEventListener('focusin', () => {
    markFormInteraction()
  })

  productForm?.addEventListener('input', () => {
    markFormInteraction()
  })

  productForm?.addEventListener('change', () => {
    markFormInteraction()
  })

  productForm?.addEventListener('submit', async (event) => {
    event.preventDefault()

    const form = event.currentTarget as HTMLFormElement
    const formData = new FormData(form)
    const file = formData.get('imageFile') as File | null
    let imageValue = FALLBACK_PRODUCT_IMAGE

    state.submittingProduct = true
    renderRefreshStatus()

    try {
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
      renderMessage()
      resetFormPause()
      await refreshDashboard(false, true)
    } finally {
      state.submittingProduct = false
      renderRefreshStatus()
    }
  })

  productsList?.addEventListener('click', async (event) => {
    const target = event.target

    if (!(target instanceof HTMLButtonElement)) {
      return
    }

    const productId = target.dataset.productId

    if (!productId) {
      return
    }

    const product = state.products.find((item) => item.id === productId)

    if (!product) {
      return
    }

    const confirmed = window.confirm(`هل تريد حذف المنتج "${product.name}"؟ لا يمكن التراجع عن هذا الإجراء.`)

    if (!confirmed) {
      return
    }

    target.disabled = true

    try {
      await deleteProduct(productId)
      state.products = state.products.filter((item) => item.id !== productId)
      state.message = `تم حذف المنتج: ${product.name}`
      renderProducts()
      renderMessage()
      await refreshDashboard(false, true)
    } finally {
      target.disabled = false
    }
  })
}

function renderAll() {
  renderStats()
  renderOrders()
  renderProducts()
  renderMessage()
  renderRefreshStatus()
}

function renderStats() {
  if (!statsGrid) {
    return
  }

  const totalOrders = state.orders.length
  const pendingOrders = state.orders.filter((order) => order.status !== 'تم التسليم').length
  const totalSales = state.orders.reduce((sum, order) => sum + order.total, 0)

  statsGrid.innerHTML = `
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
  `
}

function renderOrders() {
  if (!ordersList) {
    return
  }

  if (!state.orders.length) {
    ordersList.innerHTML = '<p class="empty-state">لا توجد طلبات حتى الآن.</p>'
    return
  }

  ordersList.innerHTML = state.orders
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
              .map((item) => `<span>${item.name} / ${item.size} × ${item.quantity}</span>`)
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
}

function getProductImageStyle(image: string) {
  if (image.startsWith('linear-gradient') || image.startsWith('radial-gradient')) {
    return `background:${image};`
  }

  return `background-image:url("${image}");background-size:cover;background-position:center;background-repeat:no-repeat;background-color:#e5e7eb;`
}

function renderProducts() {
  if (!productsList) {
    return
  }

  if (!state.products.length) {
    productsList.innerHTML = '<p class="empty-state">لا توجد منتجات حاليًا.</p>'
    return
  }

  productsList.innerHTML = state.products
    .map(
      (product) => `
        <article class="mini-product">
          <div class="mini-product__image" style="${getProductImageStyle(product.image)}"></div>
          <div class="mini-product__content">
            <div>
              <strong>${product.name}</strong>
              <p>${categories.find((category) => category.id === product.category)?.name ?? ''} · ${formatPrice(product.price)}</p>
            </div>
            <button class="danger-button" type="button" data-product-id="${product.id}">
              حذف
            </button>
          </div>
        </article>
      `,
    )
    .join('')
}

function renderMessage() {
  if (!adminMessage) {
    return
  }

  adminMessage.hidden = !state.message
  adminMessage.textContent = state.message
}

function renderRefreshStatus() {
  if (!refreshStatus) {
    return
  }

  if (state.loading) {
    refreshStatus.textContent = 'جارٍ التحديث...'
    refreshStatus.classList.remove('is-paused')
    return
  }

  if (state.submittingProduct) {
    refreshStatus.textContent = 'جارٍ حفظ المنتج...'
    refreshStatus.classList.remove('is-paused')
    return
  }

  if (isRefreshPaused()) {
    refreshStatus.textContent = 'التحديث متوقف مؤقتًا أثناء الكتابة.'
    refreshStatus.classList.add('is-paused')
    return
  }

  refreshStatus.textContent = 'تحديث تلقائي كل 10 ثوانٍ'
  refreshStatus.classList.remove('is-paused')
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function refreshDashboard(showLoading = true, force = false) {
  if (isRefreshPaused() && !force) {
    renderRefreshStatus()
    return
  }

  if (showLoading) {
    state.loading = true
    renderRefreshStatus()
  }

  try {
    const [orders, products] = await Promise.all([getOrders(), getProducts()])
    state.orders = orders
    state.products = products
    renderStats()
    renderOrders()
    renderProducts()
  } finally {
    state.loading = false
    renderRefreshStatus()
  }
}

renderShell()
void refreshDashboard()

window.setInterval(() => {
  void refreshDashboard(false)
}, AUTO_REFRESH_INTERVAL_MS)
