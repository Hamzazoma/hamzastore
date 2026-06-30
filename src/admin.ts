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

type Lang = 'ar' | 'en'
type Theme = 'light' | 'dark'

const LANG_KEY = 'storefront-lang'
const THEME_KEY = 'storefront-theme'

function readStoredLang(): Lang {
  const stored = localStorage.getItem(LANG_KEY)
  return stored === 'en' ? 'en' : 'ar'
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

function applyLanguage(lang: Lang) {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

const messages: Record<Lang, Record<string, string>> = {
  ar: {
    admin: 'لوحة الإدارة',
    title: 'متابعة الطلبات والمنتجات',
    intro:
      'التحديث التلقائي يعمل كل 10 ثوانٍ، ويتوقف مؤقتًا أثناء الكتابة داخل نموذج إضافة المنتج حتى لا تفقد أي بيانات.',
    back: 'الرجوع للمتجر',
    refreshNow: 'تحديث الآن',
    orders: 'الطلبات',
    latestOrders: 'آخر الطلبات',
    addProduct: 'إضافة منتج',
    newProduct: 'منتج جديد',
    name: 'اسم المنتج',
    price: 'السعر',
    category: 'القسم',
    description: 'الوصف',
    sizes: 'المقاسات',
    sizesHint: 'اختر مقاسًا واحدًا على الأقل.',
    image: 'الصورة',
    chooseImage: 'اختيار صورة',
    noFile: 'لم يتم اختيار ملف',
    badge: 'نص الشارة',
    add: 'إضافة المنتج',
    products: 'المنتجات الحالية',
    allProducts: 'كل المنتجات',
    status: 'حالة الطلب',
    noNotes: 'لا توجد ملاحظات',
    noOrders: 'لا توجد طلبات حتى الآن.',
    noProducts: 'لا توجد منتجات حاليًا.',
    messageAdded: 'تمت إضافة المنتج بنجاح وسيظهر في المتجر مباشرة.',
    messageDeleted: 'تم حذف المنتج:',
    confirmDelete: 'هل تريد حذف المنتج',
    confirmDeleteTail: '؟ لا يمكن التراجع عن هذا الإجراء.',
    delete: 'حذف',
    updating: 'جارٍ التحديث...',
    autoEvery: 'تحديث تلقائي كل 10 ثوانٍ',
    paused: 'التحديث متوقف مؤقتًا أثناء الكتابة.',
    saving: 'جارٍ حفظ المنتج...',
    toggleLang: 'English',
    toggleThemeLight: 'لايت',
    toggleThemeDark: 'دارك',
    totalOrders: 'إجمالي الطلبات',
    pendingOrders: 'طلبات قيد المتابعة',
    totalSales: 'إجمالي المبيعات',
    sizesRequired: 'من فضلك اختر مقاسًا واحدًا على الأقل قبل إضافة المنتج.',
    defaultBadge: 'جديد',
    orderUpdated: 'تم تحديث الطلب إلى حالة:',
    namePlaceholder: 'مثال: طقم فرنسا الأساسي',
    pricePlaceholder: '999',
    descPlaceholder: 'وصف مختصر للمنتج',
    badgePlaceholder: 'مثال: جديد',
  },
  en: {
    admin: 'Admin panel',
    title: 'Orders & Products',
    intro:
      'Auto refresh runs every 10 seconds and pauses while you type in the add-product form to avoid losing data.',
    back: 'Back to store',
    refreshNow: 'Refresh',
    orders: 'Orders',
    latestOrders: 'Latest orders',
    addProduct: 'Add product',
    newProduct: 'New product',
    name: 'Product name',
    price: 'Price',
    category: 'Category',
    description: 'Description',
    sizes: 'Sizes',
    sizesHint: 'Select at least one size.',
    image: 'Image',
    chooseImage: 'Choose image',
    noFile: 'No file chosen',
    badge: 'Badge text',
    add: 'Add product',
    products: 'Products',
    allProducts: 'All products',
    status: 'Order status',
    noNotes: 'No notes',
    noOrders: 'No orders yet.',
    noProducts: 'No products yet.',
    messageAdded: 'Product added successfully and will appear in the store.',
    messageDeleted: 'Deleted product:',
    confirmDelete: 'Delete product',
    confirmDeleteTail: '? This cannot be undone.',
    delete: 'Delete',
    updating: 'Updating...',
    autoEvery: 'Auto refresh every 10 seconds',
    paused: 'Auto refresh paused while typing.',
    saving: 'Saving product...',
    toggleLang: 'العربية',
    toggleThemeLight: 'Light',
    toggleThemeDark: 'Dark',
    totalOrders: 'Total orders',
    pendingOrders: 'Pending orders',
    totalSales: 'Total sales',
    sizesRequired: 'Please select at least one size before adding the product.',
    defaultBadge: 'New',
    orderUpdated: 'Order updated to:',
    namePlaceholder: 'e.g. France kit',
    pricePlaceholder: '999',
    descPlaceholder: 'Short product description',
    badgePlaceholder: 'e.g. New',
  },
}

function t(key: keyof (typeof messages)['ar']) {
  return messages[state.ui.lang][key] ?? messages.ar[key] ?? String(key)
}

const sizeOptions = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
]

const state: {
  orders: Order[]
  products: Product[]
  message: string
  loading: boolean
  submittingProduct: boolean
  ui: {
    lang: Lang
    theme: Theme
  }
} = {
  orders: [],
  products: [],
  message: '',
  loading: true,
  submittingProduct: false,
  ui: {
    lang: readStoredLang(),
    theme: readStoredTheme(),
  },
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
let toggleLangButton: HTMLButtonElement | null = null
let toggleThemeButton: HTMLButtonElement | null = null
let imageInput: HTMLInputElement | null = null
let imageFileButton: HTMLButtonElement | null = null
let imageFileName: HTMLSpanElement | null = null

function formatPrice(value: number) {
  return new Intl.NumberFormat(state.ui.lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(state.ui.lang === 'ar' ? 'ar-EG' : 'en-US', {
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
  applyLanguage(state.ui.lang)
  applyTheme(state.ui.theme)

  appRoot.innerHTML = `
    <div class="admin-shell">
      <header class="admin-hero">
        <div>
          <span class="eyebrow">${t('admin')}</span>
          <h1>${t('title')}</h1>
          <p>${t('intro')}</p>
        </div>
        <div class="admin-hero__actions">
          <a href="index.html">${t('back')}</a>
          <button id="manual-refresh" type="button">${t('refreshNow')}</button>
          <button id="toggle-lang" class="tool-btn" type="button">${t('toggleLang')}</button>
          <button id="toggle-theme" class="tool-btn" type="button">
            ${state.ui.theme === 'dark' ? t('toggleThemeLight') : t('toggleThemeDark')}
          </button>
        </div>
      </header>

      <section id="stats-grid" class="stats-grid"></section>

      <main class="admin-layout">
        <section class="admin-panel">
          <div class="section-head">
            <div>
              <span class="eyebrow">${t('orders')}</span>
              <h2>${t('latestOrders')}</h2>
            </div>
            <small id="refresh-status"></small>
          </div>

          <div id="orders-list" class="orders-list"></div>
        </section>

        <section class="admin-side">
          <section class="admin-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">${t('addProduct')}</span>
                <h2>${t('newProduct')}</h2>
              </div>
            </div>

            <form id="product-form" class="product-form">
              <label>
                <span>${t('name')}</span>
                <input name="name" placeholder="${t('namePlaceholder')}" required />
              </label>
              <label>
                <span>${t('price')}</span>
                <input name="price" type="number" min="1" placeholder="${t('pricePlaceholder')}" required />
              </label>
              <label>
                <span>${t('category')}</span>
                <select name="category" required>
                  ${categories
                    .map((category) => `<option value="${category.id}">${category.name}</option>`)
                    .join('')}
                </select>
              </label>
              <label>
                <span>${t('description')}</span>
                <textarea name="description" placeholder="${t('descPlaceholder')}" required></textarea>
              </label>

              <div class="sizes-picker">
                <span class="field-label">${t('sizes')}</span>
                <div class="sizes-grid">
                  ${sizeOptions
                    .map(
                      (size) => `
                        <label class="size-chip">
                          <input type="checkbox" name="sizes" value="${size}" />
                          <span>${size}</span>
                        </label>
                      `,
                    )
                    .join('')}
                </div>
                <small class="field-hint">${t('sizesHint')}</small>
              </div>

              <label>
                <span>${t('image')}</span>
                <input id="imageFile" name="imageFile" type="file" accept="image/*" class="visually-hidden" />
                <div class="file-picker">
                  <button id="file-button" class="tool-btn" type="button">${t('chooseImage')}</button>
                  <span id="file-name" class="file-name">${t('noFile')}</span>
                </div>
              </label>
              <label>
                <span>${t('badge')}</span>
                <input name="badge" placeholder="${t('badgePlaceholder')}" />
              </label>
              <button type="submit">${t('add')}</button>
            </form>
            <p id="admin-message" class="admin-message" hidden></p>
          </section>

          <section class="admin-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">${t('products')}</span>
                <h2>${t('allProducts')}</h2>
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
  toggleLangButton = document.querySelector<HTMLButtonElement>('#toggle-lang')
  toggleThemeButton = document.querySelector<HTMLButtonElement>('#toggle-theme')
  imageInput = document.querySelector<HTMLInputElement>('#imageFile')
  imageFileButton = document.querySelector<HTMLButtonElement>('#file-button')
  imageFileName = document.querySelector<HTMLSpanElement>('#file-name')

  bindEvents()
  renderAll()
}

function bindEvents() {
  manualRefreshButton?.addEventListener('click', async () => {
    resetFormPause()
    await refreshDashboard(true, true)
  })

  toggleLangButton?.addEventListener('click', () => {
    state.ui.lang = state.ui.lang === 'ar' ? 'en' : 'ar'
    localStorage.setItem(LANG_KEY, state.ui.lang)
    renderShell()
    void refreshDashboard(false, true)
  })

  toggleThemeButton?.addEventListener('click', () => {
    state.ui.theme = state.ui.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, state.ui.theme)
    applyTheme(state.ui.theme)
    if (toggleThemeButton) {
      toggleThemeButton.textContent =
        state.ui.theme === 'dark' ? t('toggleThemeLight') : t('toggleThemeDark')
    }
  })

  imageFileButton?.addEventListener('click', () => {
    imageInput?.click()
  })

  imageInput?.addEventListener('change', () => {
    if (!imageFileName || !imageInput) return
    const file = imageInput.files?.[0]
    imageFileName.textContent = file?.name || t('noFile')
    markFormInteraction()
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
    state.message = `${t('orderUpdated')} ${status}`
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
    const sizes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="sizes"]:checked')).map(
      (input) => input.value,
    )

    if (!sizes.length) {
      state.message = t('sizesRequired')
      renderMessage()
      return
    }

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
        sizes,
        badge: String(formData.get('badge') ?? '').trim() || t('defaultBadge'),
        image: imageValue,
      })

      form.reset()
      imageFileName && (imageFileName.textContent = t('noFile'))
      state.message = t('messageAdded')
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

    const confirmed = window.confirm(
      `${t('confirmDelete')} "${product.name}"${t('confirmDeleteTail')}`,
    )

    if (!confirmed) {
      return
    }

    target.disabled = true

    try {
      await deleteProduct(productId)
      state.products = state.products.filter((item) => item.id !== productId)
      state.message = `${t('messageDeleted')} ${product.name}`
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
      <small>${t('totalOrders')}</small>
      <strong>${totalOrders}</strong>
    </article>
    <article class="stat-card">
      <small>${t('pendingOrders')}</small>
      <strong>${pendingOrders}</strong>
    </article>
    <article class="stat-card">
      <small>${t('totalSales')}</small>
      <strong>${formatPrice(totalSales)}</strong>
    </article>
  `
}

function renderOrders() {
  if (!ordersList) {
    return
  }

  if (!state.orders.length) {
    ordersList.innerHTML = `<p class="empty-state">${t('noOrders')}</p>`
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
              <span>${t('status')}</span>
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
            <small>${order.notes || t('noNotes')}</small>
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
    productsList.innerHTML = `<p class="empty-state">${t('noProducts')}</p>`
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
              ${t('delete')}
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
    refreshStatus.textContent = t('updating')
    refreshStatus.classList.remove('is-paused')
    return
  }

  if (state.submittingProduct) {
    refreshStatus.textContent = t('saving')
    refreshStatus.classList.remove('is-paused')
    return
  }

  if (isRefreshPaused()) {
    refreshStatus.textContent = t('paused')
    refreshStatus.classList.add('is-paused')
    return
  }

  refreshStatus.textContent = t('autoEvery')
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
