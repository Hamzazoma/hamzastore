import './admin.css'
import {
  addProduct,
  deleteProduct,
  getCategories,
  getOrders,
  getProducts,
  updateProduct,
  updateOrderStatus,
} from './api.ts'
import { localizeCategory, localizeProduct, type Lang } from './catalogText.ts'
import type { Order, OrderStatus, Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Admin app root was not found')
}

const appRoot = app
const categories = getCategories()
const orderStatuses: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered']
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const AUTO_REFRESH_INTERVAL_MS = 10000
const FORM_IDLE_RESUME_MS = 1800
const FALLBACK_PRODUCT_IMAGE =
  'linear-gradient(135deg, #111827 0%, #334155 45%, #cbd5e1 100%)'

type Theme = 'light' | 'dark'

const LANG_KEY = 'storefront-lang'
const THEME_KEY = 'storefront-theme'

const messages: Record<Lang, Record<string, string>> = {
  ar: {
    admin: 'لوحة الإدارة',
    title: 'إدارة الطلبات والمنتجات',
    intro:
      'يتم تحديث الطلبات كل 10 ثوانٍ، ويتوقف التحديث تلقائيًا أثناء الكتابة داخل النموذج حتى لا تتأثر البيانات.',
    back: 'الرجوع للمتجر',
    refreshNow: 'تحديث الآن',
    orders: 'الطلبات',
    latestOrders: 'آخر الطلبات',
    addProduct: 'إدارة المنتج',
    newProduct: 'إضافة أو تعديل منتج',
    nameAr: 'اسم المنتج بالعربية',
    nameEn: 'اسم المنتج بالإنجليزية',
    price: 'السعر',
    category: 'القسم',
    descriptionAr: 'الوصف بالعربية',
    descriptionEn: 'الوصف بالإنجليزية',
    sizes: 'المقاسات',
    sizesHint: 'المقاسات المدعومة: XS, S, M, L, XL, XXL',
    image: 'الصورة',
    chooseImage: 'رفع صورة',
    imageHint: 'يفضل صورة مربعة أو أفقية بجودة واضحة.',
    noFile: 'لم يتم اختيار ملف',
    badgeAr: 'شارة بالعربية',
    badgeEn: 'شارة بالإنجليزية',
    add: 'إضافة المنتج',
    save: 'حفظ التعديل',
    cancelEdit: 'إلغاء التعديل',
    products: 'المنتجات',
    allProducts: 'كل المنتجات',
    status: 'حالة الطلب',
    noNotes: 'لا توجد ملاحظات',
    noOrders: 'لا توجد طلبات حتى الآن.',
    noProducts: 'لا توجد منتجات حتى الآن.',
    messageAdded: 'تمت إضافة المنتج بنجاح.',
    messageUpdated: 'تم تحديث المنتج بنجاح.',
    messageDeleted: 'تم حذف المنتج:',
    confirmDelete: 'هل تريد حذف المنتج',
    confirmDeleteTail: '؟ لا يمكن التراجع عن هذا الإجراء.',
    delete: 'حذف',
    edit: 'تعديل',
    updating: 'جارٍ التحديث...',
    autoEvery: 'تحديث تلقائي كل 10 ثوانٍ',
    paused: 'التحديث متوقف مؤقتًا أثناء الكتابة.',
    saving: 'جارٍ حفظ المنتج...',
    toggleLang: 'AR | EN',
    toggleTheme: 'داكن | فاتح',
    totalOrders: 'إجمالي الطلبات',
    pendingOrders: 'طلبات نشطة',
    totalSales: 'إجمالي المبيعات',
    sizesRequired: 'اختر مقاسًا واحدًا على الأقل.',
    defaultBadgeAr: 'جديد',
    defaultBadgeEn: 'New',
    orderUpdated: 'تم تحديث الطلب إلى:',
    nameArPlaceholder: 'مثال: طقم فرنسا الأساسي',
    nameEnPlaceholder: 'Example: France home kit',
    pricePlaceholder: '999',
    descArPlaceholder: 'وصف واضح وقصير بالعربية',
    descEnPlaceholder: 'Clear short description in English',
    badgeArPlaceholder: 'مثال: جديد',
    badgeEnPlaceholder: 'Example: New',
    uploadTitle: 'واجهة رفع جميلة مع معاينة مباشرة',
    uploadEmpty: 'لا توجد معاينة بعد',
    previewAlt: 'معاينة صورة المنتج',
    modeCreate: 'وضع الإضافة',
    modeEdit: 'وضع التعديل',
    statusNew: 'جديد',
    statusPreparing: 'قيد التجهيز',
    statusShipped: 'تم الشحن',
    statusDelivered: 'تم التسليم',
  },
  en: {
    admin: 'Admin panel',
    title: 'Manage orders and products',
    intro:
      'Orders refresh every 10 seconds, and refreshing pauses automatically while typing in the form so your data stays intact.',
    back: 'Back to store',
    refreshNow: 'Refresh now',
    orders: 'Orders',
    latestOrders: 'Latest orders',
    addProduct: 'Product management',
    newProduct: 'Add or edit product',
    nameAr: 'Arabic product name',
    nameEn: 'English product name',
    price: 'Price',
    category: 'Category',
    descriptionAr: 'Arabic description',
    descriptionEn: 'English description',
    sizes: 'Sizes',
    sizesHint: 'Supported sizes: XS, S, M, L, XL, XXL',
    image: 'Image',
    chooseImage: 'Upload image',
    imageHint: 'A square or landscape image with clear quality is recommended.',
    noFile: 'No file selected',
    badgeAr: 'Arabic badge',
    badgeEn: 'English badge',
    add: 'Add product',
    save: 'Save changes',
    cancelEdit: 'Cancel editing',
    products: 'Products',
    allProducts: 'All products',
    status: 'Order status',
    noNotes: 'No notes',
    noOrders: 'No orders yet.',
    noProducts: 'No products yet.',
    messageAdded: 'Product added successfully.',
    messageUpdated: 'Product updated successfully.',
    messageDeleted: 'Deleted product:',
    confirmDelete: 'Delete product',
    confirmDeleteTail: '? This action cannot be undone.',
    delete: 'Delete',
    edit: 'Edit',
    updating: 'Updating...',
    autoEvery: 'Auto refresh every 10 seconds',
    paused: 'Refresh paused while typing.',
    saving: 'Saving product...',
    toggleLang: 'AR | EN',
    toggleTheme: 'Dark / Light',
    totalOrders: 'Total orders',
    pendingOrders: 'Active orders',
    totalSales: 'Total sales',
    sizesRequired: 'Select at least one size.',
    defaultBadgeAr: 'جديد',
    defaultBadgeEn: 'New',
    orderUpdated: 'Order updated to:',
    nameArPlaceholder: 'Example: طقم فرنسا الأساسي',
    nameEnPlaceholder: 'Example: France home kit',
    pricePlaceholder: '999',
    descArPlaceholder: 'Clear short description in Arabic',
    descEnPlaceholder: 'Clear short description in English',
    badgeArPlaceholder: 'Example: جديد',
    badgeEnPlaceholder: 'Example: New',
    uploadTitle: 'Beautiful upload area with instant preview',
    uploadEmpty: 'No preview yet',
    previewAlt: 'Product image preview',
    modeCreate: 'Create mode',
    modeEdit: 'Edit mode',
    statusNew: 'New',
    statusPreparing: 'Preparing',
    statusShipped: 'Shipped',
    statusDelivered: 'Delivered',
  },
}

const state: {
  orders: Order[]
  products: Product[]
  message: string
  loading: boolean
  submittingProduct: boolean
  formMode: 'create' | 'edit'
  editingProductId: string | null
  imagePreview: string
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
  formMode: 'create',
  editingProductId: null,
  imagePreview: '',
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
let imagePreviewBox: HTMLDivElement | null = null
let cancelEditButton: HTMLButtonElement | null = null
let submitButton: HTMLButtonElement | null = null
let formModeBadge: HTMLSpanElement | null = null

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

function t(key: keyof (typeof messages)['ar']) {
  return messages[state.ui.lang][key] ?? messages.ar[key] ?? String(key)
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatPrice(value: number) {
  return new Intl.NumberFormat(state.ui.lang === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(state.ui.lang === 'ar' ? 'ar-SA' : 'en-SA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getOrderStatusLabel(status: OrderStatus) {
  const keyMap: Record<OrderStatus, keyof (typeof messages)['ar']> = {
    new: 'statusNew',
    preparing: 'statusPreparing',
    shipped: 'statusShipped',
    delivered: 'statusDelivered',
  }

  return t(keyMap[status])
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
  if (!productForm) return
  formRefreshState.pausedUntil = Date.now() + duration
  renderRefreshStatus()
  scheduleRefreshResume()
}

function resetFormPause() {
  formRefreshState.pausedUntil = 0
  clearFormPauseTimer()
  renderRefreshStatus()
}

function getLocalizedCategories() {
  return categories.map((category) => localizeCategory(category, state.ui.lang))
}

function getProductImageStyle(image: string) {
  if (image.startsWith('linear-gradient') || image.startsWith('radial-gradient')) {
    return `background:${image};`
  }

  return `background-image:url("${image}");background-size:cover;background-position:center;background-repeat:no-repeat;background-color:#e5e7eb;`
}

function renderImagePreview() {
  if (!imagePreviewBox) return

  if (!state.imagePreview) {
    imagePreviewBox.innerHTML = `
      <div class="upload-preview__empty">
        <strong>${t('uploadTitle')}</strong>
        <span>${t('uploadEmpty')}</span>
      </div>
    `
    return
  }

  if (state.imagePreview.startsWith('data:image/')) {
    imagePreviewBox.innerHTML = `<img src="${state.imagePreview}" alt="${t('previewAlt')}" />`
    return
  }

  imagePreviewBox.innerHTML = `<div class="upload-preview__gradient" style="${getProductImageStyle(state.imagePreview)}" aria-label="${t('previewAlt')}"></div>`
}

function getSelectedSizes() {
  return Array.from(productForm?.querySelectorAll<HTMLInputElement>('input[name="sizes"]:checked') ?? []).map(
    (input) => input.value,
  )
}

function setSelectedSizes(sizes: string[]) {
  productForm?.querySelectorAll<HTMLInputElement>('input[name="sizes"]').forEach((input) => {
    input.checked = sizes.includes(input.value)
  })
}

function resetProductForm() {
  productForm?.reset()
  setSelectedSizes([])
  state.formMode = 'create'
  state.editingProductId = null
  state.imagePreview = ''
  if (imageFileName) {
    imageFileName.textContent = t('noFile')
  }
  if (imageInput) {
    imageInput.value = ''
  }
  renderImagePreview()
  renderFormMode()
}

function renderFormMode() {
  if (formModeBadge) {
    formModeBadge.textContent = state.formMode === 'edit' ? t('modeEdit') : t('modeCreate')
  }
  if (submitButton) {
    submitButton.textContent = state.formMode === 'edit' ? t('save') : t('add')
  }
  if (cancelEditButton) {
    cancelEditButton.hidden = state.formMode !== 'edit'
  }
}

function loadProductIntoForm(product: Product) {
  if (!productForm) return

  state.formMode = 'edit'
  state.editingProductId = product.id

  const localized = localizeProduct(product, state.ui.lang)

  ;(productForm.elements.namedItem('nameAr') as HTMLInputElement | null)!.value = product.nameAr ?? ''
  ;(productForm.elements.namedItem('nameEn') as HTMLInputElement | null)!.value = product.nameEn ?? ''
  ;(productForm.elements.namedItem('price') as HTMLInputElement | null)!.value = String(product.price)
  ;(productForm.elements.namedItem('category') as HTMLSelectElement | null)!.value = product.category
  ;(productForm.elements.namedItem('descriptionAr') as HTMLTextAreaElement | null)!.value =
    product.descriptionAr ?? ''
  ;(productForm.elements.namedItem('descriptionEn') as HTMLTextAreaElement | null)!.value =
    product.descriptionEn ?? ''
  ;(productForm.elements.namedItem('badgeAr') as HTMLInputElement | null)!.value = product.badgeAr ?? ''
  ;(productForm.elements.namedItem('badgeEn') as HTMLInputElement | null)!.value = product.badgeEn ?? ''
  setSelectedSizes(product.sizes)

  state.imagePreview = product.image
  if (imageFileName) {
    imageFileName.textContent = localized.name
  }
  renderImagePreview()
  renderFormMode()
  state.message = ''
  renderMessage()
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function renderShell() {
  applyLanguage(state.ui.lang)
  applyTheme(state.ui.theme)
  const localizedCategories = getLocalizedCategories()

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
          <button id="toggle-theme" class="tool-btn" type="button">${t('toggleTheme')}</button>
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
              <span id="form-mode" class="mode-badge">${t('modeCreate')}</span>
            </div>

            <form id="product-form" class="product-form">
              <div class="two-columns">
                <label>
                  <span>${t('nameAr')}</span>
                  <input name="nameAr" placeholder="${t('nameArPlaceholder')}" required />
                </label>
                <label>
                  <span>${t('nameEn')}</span>
                  <input name="nameEn" placeholder="${t('nameEnPlaceholder')}" required />
                </label>
              </div>

              <div class="two-columns">
                <label>
                  <span>${t('price')}</span>
                  <input name="price" type="number" min="1" placeholder="${t('pricePlaceholder')}" required />
                </label>
                <label>
                  <span>${t('category')}</span>
                  <select name="category" required>
                    ${localizedCategories
                      .map((category) => `<option value="${category.id}">${category.name}</option>`)
                      .join('')}
                  </select>
                </label>
              </div>

              <div class="two-columns">
                <label>
                  <span>${t('descriptionAr')}</span>
                  <textarea name="descriptionAr" placeholder="${t('descArPlaceholder')}" required></textarea>
                </label>
                <label>
                  <span>${t('descriptionEn')}</span>
                  <textarea name="descriptionEn" placeholder="${t('descEnPlaceholder')}" required></textarea>
                </label>
              </div>

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

              <div class="upload-card">
                <div class="upload-card__top">
                  <div>
                    <span>${t('image')}</span>
                    <small>${t('imageHint')}</small>
                  </div>
                  <button id="file-button" class="tool-btn" type="button">${t('chooseImage')}</button>
                </div>
                <input id="imageFile" name="imageFile" type="file" accept="image/*" class="visually-hidden" />
                <div id="image-preview" class="upload-preview"></div>
                <span id="file-name" class="file-name">${t('noFile')}</span>
              </div>

              <div class="two-columns">
                <label>
                  <span>${t('badgeAr')}</span>
                  <input name="badgeAr" placeholder="${t('badgeArPlaceholder')}" />
                </label>
                <label>
                  <span>${t('badgeEn')}</span>
                  <input name="badgeEn" placeholder="${t('badgeEnPlaceholder')}" />
                </label>
              </div>

              <div class="form-actions">
                <button id="submit-product" type="submit">${t('add')}</button>
                <button id="cancel-edit" class="tool-btn" type="button" hidden>${t('cancelEdit')}</button>
              </div>
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
  imagePreviewBox = document.querySelector<HTMLDivElement>('#image-preview')
  cancelEditButton = document.querySelector<HTMLButtonElement>('#cancel-edit')
  submitButton = document.querySelector<HTMLButtonElement>('#submit-product')
  formModeBadge = document.querySelector<HTMLSpanElement>('#form-mode')

  bindEvents()
  renderAll()
  renderImagePreview()
  renderFormMode()
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
    renderShell()
  })

  imageFileButton?.addEventListener('click', () => {
    imageInput?.click()
  })

  imageInput?.addEventListener('change', async () => {
    if (!imageInput || !imageFileName) return
    const file = imageInput.files?.[0]
    imageFileName.textContent = file?.name || t('noFile')
    if (file && file.size) {
      state.imagePreview = await readFileAsDataUrl(file)
    }
    renderImagePreview()
    markFormInteraction()
  })

  cancelEditButton?.addEventListener('click', () => {
    resetProductForm()
    state.message = ''
    renderMessage()
  })

  ordersList?.addEventListener('change', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return

    const orderId = target.dataset.orderId
    const status = target.value as OrderStatus
    if (!orderId) return

    await updateOrderStatus(orderId, status)
    state.message = `${t('orderUpdated')} ${getOrderStatusLabel(status)}`
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
    const sizes = getSelectedSizes()

    if (!sizes.length) {
      state.message = t('sizesRequired')
      renderMessage()
      return
    }

    state.submittingProduct = true
    renderRefreshStatus()

    try {
      let imageValue = state.imagePreview || FALLBACK_PRODUCT_IMAGE
      if (file && file.size) {
        imageValue = await readFileAsDataUrl(file)
      }

      const payload = {
        name: String(formData.get('nameAr') ?? '').trim(),
        nameAr: String(formData.get('nameAr') ?? '').trim(),
        nameEn: String(formData.get('nameEn') ?? '').trim(),
        category: String(formData.get('category') ?? 'men') as Product['category'],
        price: Number(formData.get('price') ?? 0),
        description: String(formData.get('descriptionAr') ?? '').trim(),
        descriptionAr: String(formData.get('descriptionAr') ?? '').trim(),
        descriptionEn: String(formData.get('descriptionEn') ?? '').trim(),
        sizes,
        badge: String(formData.get('badgeAr') ?? '').trim() || t('defaultBadgeAr'),
        badgeAr: String(formData.get('badgeAr') ?? '').trim() || t('defaultBadgeAr'),
        badgeEn: String(formData.get('badgeEn') ?? '').trim() || t('defaultBadgeEn'),
        image: imageValue,
      }

      if (state.formMode === 'edit' && state.editingProductId) {
        await updateProduct(state.editingProductId, payload)
        state.message = t('messageUpdated')
      } else {
        await addProduct(payload)
        state.message = t('messageAdded')
      }

      renderMessage()
      resetProductForm()
      resetFormPause()
      await refreshDashboard(false, true)
    } finally {
      state.submittingProduct = false
      renderRefreshStatus()
    }
  })

  productsList?.addEventListener('click', async (event) => {
    const target = event.target
    if (!(target instanceof HTMLButtonElement)) return

    const productId = target.dataset.productId
    if (!productId) return

    const product = state.products.find((item) => item.id === productId)
    if (!product) return

    if (target.dataset.action === 'edit') {
      loadProductIntoForm(product)
      return
    }

    if (target.dataset.action === 'delete') {
      const localized = localizeProduct(product, state.ui.lang)
      const confirmed = window.confirm(
        `${t('confirmDelete')} "${localized.name}"${t('confirmDeleteTail')}`,
      )
      if (!confirmed) return

      target.disabled = true
      try {
        await deleteProduct(productId)
        state.products = state.products.filter((item) => item.id !== productId)
        state.message = `${t('messageDeleted')} ${localized.name}`
        if (state.editingProductId === productId) {
          resetProductForm()
        }
        renderProducts()
        renderMessage()
        await refreshDashboard(false, true)
      } finally {
        target.disabled = false
      }
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
  if (!statsGrid) return

  const totalOrders = state.orders.length
  const pendingOrders = state.orders.filter((order) => order.status !== 'delivered').length
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
  if (!ordersList) return

  if (state.loading) {
    ordersList.innerHTML = Array.from({ length: 3 }, () => `
      <article class="order-card order-card--skeleton">
        <div class="skeleton skeleton-line skeleton-line--short"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
      </article>
    `).join('')
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
              <strong>${escapeHtml(order.customerName)}</strong>
              <p>${escapeHtml(order.phone)}</p>
            </div>
            <div class="order-card__meta">
              <span>${formatPrice(order.total)}</span>
              <small>${formatDate(order.createdAt)}</small>
            </div>
          </div>
          <p class="order-address">${escapeHtml(order.address)}</p>
          <div class="order-items">
            ${order.items
              .map(
                (item) =>
                  `<span>${escapeHtml(item.name)} / ${item.size} × ${item.quantity}</span>`,
              )
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
                        ${getOrderStatusLabel(status)}
                      </option>
                    `,
                  )
                  .join('')}
              </select>
            </label>
            <small>${escapeHtml(order.notes || t('noNotes'))}</small>
          </div>
        </article>
      `,
    )
    .join('')
}

function renderProducts() {
  if (!productsList) return

  if (state.loading) {
    productsList.innerHTML = Array.from({ length: 4 }, () => `
      <article class="mini-product mini-product--skeleton">
        <div class="mini-product__image skeleton"></div>
        <div class="mini-product__content">
          <div class="skeleton skeleton-line skeleton-line--short"></div>
          <div class="skeleton skeleton-line"></div>
        </div>
      </article>
    `).join('')
    return
  }

  if (!state.products.length) {
    productsList.innerHTML = `<p class="empty-state">${t('noProducts')}</p>`
    return
  }

  productsList.innerHTML = state.products
    .map((product) => {
      const localized = localizeProduct(product, state.ui.lang)
      const category = localizeCategory(
        categories.find((entry) => entry.id === product.category) ?? categories[0],
        state.ui.lang,
      )

      return `
        <article class="mini-product">
          <div class="mini-product__image" style="${getProductImageStyle(product.image)}"></div>
          <div class="mini-product__content">
            <div>
              <strong>${escapeHtml(localized.name)}</strong>
              <p>${escapeHtml(category.name)} · ${formatPrice(product.price)} · ${product.sizes.join(', ')}</p>
            </div>
            <div class="mini-product__actions">
              <button class="tool-btn" type="button" data-action="edit" data-product-id="${product.id}">
                ${t('edit')}
              </button>
              <button class="danger-button" type="button" data-action="delete" data-product-id="${product.id}">
                ${t('delete')}
              </button>
            </div>
          </div>
        </article>
      `
    })
    .join('')
}

function renderMessage() {
  if (!adminMessage) return

  adminMessage.hidden = !state.message
  adminMessage.textContent = state.message
}

function renderRefreshStatus() {
  if (!refreshStatus) return

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
    renderOrders()
    renderProducts()
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
