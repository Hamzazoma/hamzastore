import './product.css'
import { getCategories, getProducts } from './api.ts'
import { localizeCategory, localizeProduct, type Lang } from './catalogText.ts'
import { readCart, writeCart } from './cartStorage.ts'
import type { Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Product app root was not found')
}

const appRoot = app
const categories = getCategories()
const LANG_KEY = 'storefront-lang'
const THEME_KEY = 'storefront-theme'
type Theme = 'light' | 'dark'

const messages: Record<Lang, Record<string, string>> = {
  ar: {
    back: 'العودة للمتجر',
    toggleLang: 'AR | EN',
    toggleTheme: 'داكن | فاتح',
    details: 'تفاصيل المنتج',
    chooseSize: 'اختر المقاس',
    addToCart: 'أضف إلى السلة',
    cartAdded: 'تمت إضافة المنتج إلى السلة.',
    description: 'الوصف',
    availableSizes: 'المقاسات المتاحة',
    suggestions: 'منتجات مشابهة',
    notFound: 'هذا المنتج غير متاح حاليًا.',
    goHome: 'العودة للرئيسية',
    loading: 'جارٍ تحميل الصفحة...',
    priceLabel: 'السعر',
    categoryLabel: 'القسم',
    benefit1: 'سعر واضح بعملة SAR فقط',
    benefit2: 'تبديل فوري بين العربية والإنجليزية',
    benefit3: 'الثيم والسلة محفوظان تلقائيًا',
  },
  en: {
    back: 'Back to store',
    toggleLang: 'AR | EN',
    toggleTheme: 'Dark / Light',
    details: 'Product details',
    chooseSize: 'Choose size',
    addToCart: 'Add to cart',
    cartAdded: 'Product added to cart.',
    description: 'Description',
    availableSizes: 'Available sizes',
    suggestions: 'Related products',
    notFound: 'This product is currently unavailable.',
    goHome: 'Back to home',
    loading: 'Loading page...',
    priceLabel: 'Price',
    categoryLabel: 'Category',
    benefit1: 'Clear pricing in SAR only',
    benefit2: 'Instant Arabic and English switching',
    benefit3: 'Theme and cart stay saved automatically',
  },
}

const state: {
  products: Product[]
  product: Product | null
  lang: Lang
  theme: Theme
  loading: boolean
  notice: string
} = {
  products: [],
  product: null,
  lang: readStoredLang(),
  theme: readStoredTheme(),
  loading: true,
  notice: '',
}

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
  return messages[state.lang][key] ?? messages.ar[key] ?? String(key)
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
  return new Intl.NumberFormat(state.lang === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getProductId() {
  return new URLSearchParams(window.location.search).get('id')
}

function persistCart(productId: string, size: string) {
  const cart = readCart()
  const existingItem = cart.find((item) => item.productId === productId && item.size === size)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.unshift({ productId, size, quantity: 1 })
  }

  writeCart(cart)
}

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.append(element)
  }
  element.setAttribute('content', content)
}

function updateSeo() {
  const localized = state.product ? localizeProduct(state.product, state.lang) : null
  const title = localized ? `${localized.name} | ${t('details')}` : t('details')
  const description = localized?.description ?? t('details')

  document.title = title
  setMeta('description', description)
  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
  setMeta('theme-color', state.theme === 'dark' ? '#05070c' : '#ffffff')
}

function renderMedia(product: Product, alt: string) {
  if (product.image.startsWith('data:image/')) {
    return `<img src="${product.image}" alt="${escapeHtml(alt)}" loading="eager" decoding="async" />`
  }

  return `<div class="product-media__gradient" style="background:${product.image}" aria-label="${escapeHtml(alt)}"></div>`
}

function renderSuggestionMedia(product: Product, alt: string) {
  if (product.image.startsWith('data:image/')) {
    return `<img src="${product.image}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`
  }

  return `<div class="suggestion-card__gradient" style="background:${product.image}" aria-label="${escapeHtml(alt)}"></div>`
}

function renderLoading() {
  applyLanguage(state.lang)
  applyTheme(state.theme)
  updateSeo()

  appRoot.innerHTML = `
    <main class="product-shell">
      <div class="product-topbar">
        <a href="index.html" class="back-link">${t('back')}</a>
        <div class="topbar-actions">
          <button class="tool-btn" type="button">${t('toggleLang')}</button>
          <button class="tool-btn" type="button">${t('toggleTheme')}</button>
        </div>
      </div>
      <section class="product-layout">
        <div class="product-media skeleton"></div>
        <div class="product-info">
          <div class="skeleton skeleton-line skeleton-line--short"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="skeleton skeleton-line"></div>
          <div class="sizes-row">
            <span class="skeleton skeleton-pill"></span>
            <span class="skeleton skeleton-pill"></span>
            <span class="skeleton skeleton-pill"></span>
          </div>
        </div>
      </section>
      <p class="loading-copy">${t('loading')}</p>
    </main>
  `
}

function renderNotFound() {
  applyLanguage(state.lang)
  applyTheme(state.theme)
  updateSeo()

  appRoot.innerHTML = `
    <main class="product-shell product-empty">
      <div class="product-empty__card">
        <p>${t('notFound')}</p>
        <a href="index.html" class="back-link">${t('goHome')}</a>
      </div>
    </main>
  `
}

function render() {
  if (state.loading) {
    renderLoading()
    return
  }

  if (!state.product) {
    renderNotFound()
    return
  }

  applyLanguage(state.lang)
  applyTheme(state.theme)
  updateSeo()

  const product = localizeProduct(state.product, state.lang)
  const category = localizeCategory(
    categories.find((item) => item.id === state.product?.category) ?? categories[0],
    state.lang,
  )
  const suggestions = state.products
    .filter((item) => item.id !== state.product?.id)
    .filter((item) => item.category === state.product?.category)
    .slice(0, 4)

  appRoot.innerHTML = `
    <main class="product-shell">
      <header class="product-topbar">
        <a href="index.html" class="back-link">${t('back')}</a>
        <div class="topbar-actions">
          <button id="toggle-lang" class="tool-btn" type="button">${t('toggleLang')}</button>
          <button id="toggle-theme" class="tool-btn" type="button">${t('toggleTheme')}</button>
        </div>
      </header>

      <section class="product-layout">
        <div class="product-media">
          ${renderMedia(state.product, product.name)}
        </div>

        <div class="product-info">
          <span class="product-category">${escapeHtml(category.name)}</span>
          <h1>${escapeHtml(product.name)}</h1>
          <div class="product-meta">
            <div>
              <small>${t('categoryLabel')}</small>
              <strong>${escapeHtml(category.name)}</strong>
            </div>
            <div>
              <small>${t('priceLabel')}</small>
              <strong class="product-price">${formatPrice(state.product.price)}</strong>
            </div>
          </div>

          <section class="product-block">
            <h2>${t('description')}</h2>
            <p>${escapeHtml(product.description)}</p>
          </section>

          <section class="product-block">
            <h2>${t('availableSizes')}</h2>
            <div class="sizes-row">
              ${state.product.sizes.map((size) => `<span>${size}</span>`).join('')}
            </div>
          </section>

          <div class="product-actions">
            <label class="size-picker">
              <span>${t('chooseSize')}</span>
              <select id="product-size">
                ${state.product.sizes.map((size) => `<option value="${size}">${size}</option>`).join('')}
              </select>
            </label>
            <button id="add-to-cart" class="primary-btn" type="button">${t('addToCart')}</button>
          </div>

          ${state.notice ? `<p class="notice">${escapeHtml(state.notice)}</p>` : ''}

          <section class="product-benefits">
            <article>${t('benefit1')}</article>
            <article>${t('benefit2')}</article>
            <article>${t('benefit3')}</article>
          </section>
        </div>
      </section>

      <section class="suggestions">
        <div class="section-head">
          <h2>${t('suggestions')}</h2>
        </div>
        <div class="suggestions-grid">
          ${suggestions
            .map((item) => {
              const displayProduct = localizeProduct(item, state.lang)
              return `
                <article class="suggestion-card">
                  <button class="suggestion-card__click" type="button" data-product-id="${item.id}" aria-label="${escapeHtml(displayProduct.name)}"></button>
                  <div class="suggestion-card__image">
                    ${renderSuggestionMedia(item, displayProduct.name)}
                  </div>
                  <div class="suggestion-card__body">
                    <strong>${escapeHtml(displayProduct.name)}</strong>
                    <span>${formatPrice(item.price)}</span>
                  </div>
                </article>
              `
            })
            .join('')}
        </div>
      </section>
    </main>
  `

  document.querySelector('#toggle-lang')?.addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar'
    localStorage.setItem(LANG_KEY, state.lang)
    render()
  })

  document.querySelector('#toggle-theme')?.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, state.theme)
    render()
  })

  document.querySelector('#add-to-cart')?.addEventListener('click', () => {
    const sizeSelect = document.querySelector<HTMLSelectElement>('#product-size')
    const size = sizeSelect?.value

    if (!size || !state.product) {
      return
    }

    persistCart(state.product.id, size)
    state.notice = t('cartAdded')
    render()
  })

  document.querySelectorAll<HTMLElement>('[data-product-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextProductId = button.dataset.productId
      if (!nextProductId) return
      window.location.href = `product.html?id=${encodeURIComponent(nextProductId)}`
    })
  })
}

async function bootstrap() {
  render()

  try {
    state.products = await getProducts()
    state.product = state.products.find((item) => item.id === getProductId()) ?? null
  } finally {
    state.loading = false
    render()
  }
}

void bootstrap()
