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
    back: 'العودة للمتجر',
    toggleLang: 'English',
    toggleThemeLight: 'لايت',
    toggleThemeDark: 'دارك',
    details: 'تفاصيل المنتج',
    chooseSize: 'اختيار المقاس',
    addToCart: 'أضف للسلة',
    cartAdded: 'تمت إضافة المنتج إلى السلة.',
    description: 'الوصف',
    availableSizes: 'المقاسات المتاحة',
    suggestions: 'اقتراحات قد تعجبك',
    notFound: 'المنتج غير موجود أو تم حذفه.',
    goHome: 'الرجوع للرئيسية',
  },
  en: {
    back: 'Back to store',
    toggleLang: 'العربية',
    toggleThemeLight: 'Light',
    toggleThemeDark: 'Dark',
    details: 'Product details',
    chooseSize: 'Choose size',
    addToCart: 'Add to cart',
    cartAdded: 'Product added to cart.',
    description: 'Description',
    availableSizes: 'Available sizes',
    suggestions: 'You may also like',
    notFound: 'This product was not found or has been removed.',
    goHome: 'Go home',
  },
}

const state: {
  products: Product[]
  product: Product | null
  lang: Lang
  theme: Theme
  notice: string
} = {
  products: [],
  product: null,
  lang: readStoredLang(),
  theme: readStoredTheme(),
  notice: '',
}

function t(key: keyof (typeof messages)['ar']) {
  return messages[state.lang][key] ?? messages.ar[key] ?? String(key)
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

function renderNotFound() {
  applyLanguage(state.lang)
  applyTheme(state.theme)

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
  if (!state.product) {
    renderNotFound()
    return
  }

  applyLanguage(state.lang)
  applyTheme(state.theme)

  const product = localizeProduct(state.product, state.lang)
  const category = localizeCategory(
    categories.find((item) => item.id === state.product?.category) ?? categories[0],
    state.lang,
  )
  const suggestions = state.products
    .filter((item) => item.id !== state.product?.id)
    .filter((item) => item.category === state.product?.category)
    .slice(0, 4)

  document.title = `${product.name} | ${t('details')}`

  appRoot.innerHTML = `
    <main class="product-shell">
      <header class="product-topbar">
        <a href="index.html" class="back-link">${t('back')}</a>
        <div class="topbar-actions">
          <button id="toggle-lang" class="tool-btn" type="button">${t('toggleLang')}</button>
          <button id="toggle-theme" class="tool-btn" type="button">
            ${state.theme === 'dark' ? t('toggleThemeLight') : t('toggleThemeDark')}
          </button>
        </div>
      </header>

      <section class="product-layout">
        <div class="product-media" style="background:${state.product.image}"></div>

        <div class="product-info">
          <span class="product-category">${category.name}</span>
          <h1>${product.name}</h1>
          <strong class="product-price">${formatPrice(state.product.price)}</strong>

          <section class="product-block">
            <h2>${t('description')}</h2>
            <p>${product.description}</p>
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

          ${state.notice ? `<p class="notice">${state.notice}</p>` : ''}
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
                  <button class="suggestion-card__click" type="button" data-product-id="${item.id}" aria-label="${displayProduct.name}"></button>
                  <div class="suggestion-card__image" style="background:${item.image}"></div>
                  <div class="suggestion-card__body">
                    <strong>${displayProduct.name}</strong>
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
  state.products = await getProducts()
  state.product = state.products.find((item) => item.id === getProductId()) ?? null
  render()
}

void bootstrap()
