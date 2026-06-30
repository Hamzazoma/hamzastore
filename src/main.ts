import './style.css'
import { createOrder, getCategories, getProducts } from './api.ts'
import { localizeCategory, localizeProduct, type Lang } from './catalogText.ts'
import { readCart, writeCart } from './cartStorage.ts'
import type { CartItem, CategoryId, Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found')
}

type Theme = 'light' | 'dark'

const appRoot = app
const categories = getCategories()
const LANG_KEY = 'storefront-lang'
const THEME_KEY = 'storefront-theme'

const messages: Record<Lang, Record<string, string>> = {
  ar: {
    brandTag: 'متجر ملابس عصري',
    headline: 'تجربة تسوق ثنائية اللغة، سريعة ومحفوظة',
    subhead:
      'اختَر القسم والمقاس، أضف إلى السلة، وأرسل الطلب خلال ثوانٍ مع حفظ اللغة والثيم والسلة تلقائيًا.',
    heroBadge: 'New season',
    heroTitle: 'منتجات مرتبة بوضوح ودعم كامل للعربية والإنجليزية',
    heroText:
      'واجهة سريعة، أسعار SAR فقط، وصفحات منتجات مستقلة، وتجربة شراء مناسبة للجوال والكمبيوتر.',
    heroPrimary: 'ابدأ التسوق',
    heroSecondary: 'تصفّح الأقسام',
    navProducts: 'المنتجات',
    navCart: 'السلة',
    highlights1Title: 'SAR فقط',
    highlights1Text: 'كل الأسعار معروضة بعملة واحدة وواضحة.',
    highlights2Title: 'AR | EN',
    highlights2Text: 'تبديل فوري بدون خلط بين اللغتين.',
    highlights3Title: 'Dark / Light',
    highlights3Text: 'الثيم المفضل محفوظ تلقائيًا.',
    sectionsEyebrow: 'الأقسام',
    sectionsTitle: 'اختر القسم المناسب ثم صفِّ النتائج حسب المقاس',
    filtersAll: 'الكل',
    sizeLabel: 'المقاس',
    sizeAll: 'كل المقاسات',
    resultsCount: 'عدد المنتجات',
    addToCart: 'أضف للسلة',
    viewDetails: 'عرض التفاصيل',
    cartEyebrow: 'السلة',
    cartTitle: 'طلبك الحالي',
    cartEmpty: 'لم تتم إضافة أي منتج بعد.',
    cartSize: 'المقاس',
    cartRemove: 'إزالة',
    cartTotal: 'الإجمالي',
    customerName: 'الاسم',
    customerNamePlaceholder: 'اسم العميل',
    phone: 'رقم الجوال',
    phonePlaceholder: '05xxxxxxxx',
    address: 'العنوان',
    addressPlaceholder: 'المدينة - الحي - الشارع',
    notes: 'ملاحظات',
    notesPlaceholder: 'تفاصيل إضافية إن وجدت',
    checkout: 'إرسال الطلب',
    checkoutSending: 'جارٍ إرسال الطلب...',
    noticeNeedProduct: 'أضف منتجًا واحدًا على الأقل قبل إرسال الطلب.',
    noticeNeedCustomer: 'يرجى تعبئة الاسم ورقم الجوال والعنوان.',
    noticeAdded: 'تمت إضافة المنتج إلى السلة.',
    noticeSuccess: 'تم إرسال الطلب بنجاح.',
    noticeFail: 'تعذر إرسال الطلب الآن. حاول مرة أخرى.',
    defaultBadge: 'منتج',
    loading: 'جارٍ تحميل المنتجات...',
    emptyProducts: 'لا توجد منتجات مطابقة للفلاتر الحالية.',
    languageToggle: 'AR | EN',
    themeToggle: 'داكن | فاتح',
    footerText: 'متجر سريع ومهيأ للأجهزة المختلفة مع حفظ السلة محليًا.',
  },
  en: {
    brandTag: 'Modern fashion store',
    headline: 'Fast bilingual shopping with saved preferences',
    subhead:
      'Choose a category and size, add products to cart, and place the order in seconds with saved language, theme, and cart.',
    heroBadge: 'New season',
    heroTitle: 'Clean catalog with full Arabic and English support',
    heroText:
      'Fast storefront, SAR-only pricing, standalone product pages, and a shopping flow built for desktop and mobile.',
    heroPrimary: 'Start shopping',
    heroSecondary: 'Browse categories',
    navProducts: 'Products',
    navCart: 'Cart',
    highlights1Title: 'SAR only',
    highlights1Text: 'All prices use one clear currency.',
    highlights2Title: 'AR | EN',
    highlights2Text: 'Instant language switch without mixed copy.',
    highlights3Title: 'Dark / Light',
    highlights3Text: 'Your preferred theme stays saved.',
    sectionsEyebrow: 'Categories',
    sectionsTitle: 'Choose a category, then filter by size',
    filtersAll: 'All',
    sizeLabel: 'Size',
    sizeAll: 'All sizes',
    resultsCount: 'Products',
    addToCart: 'Add to cart',
    viewDetails: 'View details',
    cartEyebrow: 'Cart',
    cartTitle: 'Current order',
    cartEmpty: 'No products added yet.',
    cartSize: 'Size',
    cartRemove: 'Remove',
    cartTotal: 'Total',
    customerName: 'Name',
    customerNamePlaceholder: 'Customer name',
    phone: 'Phone',
    phonePlaceholder: '05xxxxxxxx',
    address: 'Address',
    addressPlaceholder: 'City - district - street',
    notes: 'Notes',
    notesPlaceholder: 'Extra details if needed',
    checkout: 'Place order',
    checkoutSending: 'Sending order...',
    noticeNeedProduct: 'Add at least one product before sending the order.',
    noticeNeedCustomer: 'Please fill in name, phone, and address.',
    noticeAdded: 'Product added to cart.',
    noticeSuccess: 'Order sent successfully.',
    noticeFail: 'Unable to send the order right now. Please try again.',
    defaultBadge: 'Product',
    loading: 'Loading products...',
    emptyProducts: 'No products match the current filters.',
    languageToggle: 'AR | EN',
    themeToggle: 'Dark / Light',
    footerText: 'Responsive storefront with locally saved cart and preferences.',
  },
}

const state: {
  products: Product[]
  cart: CartItem[]
  selectedCategory: CategoryId | 'all'
  selectedSize: string
  ui: {
    lang: Lang
    theme: Theme
  }
  checkout: {
    customerName: string
    phone: string
    address: string
    notes: string
  }
  loading: boolean
  submitting: boolean
  notice: string
} = {
  products: [],
  cart: readCart(),
  selectedCategory: 'all',
  selectedSize: 'all',
  ui: {
    lang: readStoredLang(),
    theme: readStoredTheme(),
  },
  checkout: {
    customerName: '',
    phone: '',
    address: '',
    notes: '',
  },
  loading: true,
  submitting: false,
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

function getLocalizedCategories() {
  return categories.map((category) => localizeCategory(category, state.ui.lang))
}

function getLocalizedProduct(product: Product) {
  return localizeProduct(product, state.ui.lang)
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const categoryMatch =
      state.selectedCategory === 'all' || product.category === state.selectedCategory
    const sizeMatch =
      state.selectedSize === 'all' || product.sizes.includes(state.selectedSize)

    return categoryMatch && sizeMatch
  })
}

function getAllSizes() {
  return ['all', ...new Set(state.products.flatMap((product) => product.sizes))]
}

function findProduct(productId: string) {
  return state.products.find((product) => product.id === productId)
}

function persistCart() {
  writeCart(state.cart)
}

function buildCartDetails() {
  return state.cart
    .map((item) => {
      const product = findProduct(item.productId)
      if (!product) return null

      const displayProduct = getLocalizedProduct(product)

      return {
        productId: product.id,
        name: displayProduct.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function getCartTotal() {
  return buildCartDetails().reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function goToProduct(productId: string) {
  window.location.href = `product.html?id=${encodeURIComponent(productId)}`
}

function scrollToId(id: string) {
  document.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  const title =
    state.ui.lang === 'ar'
      ? 'متجر ملابس - تجربة ثنائية اللغة وأسعار SAR'
      : 'Fashion store - bilingual shopping in SAR'
  const description =
    state.ui.lang === 'ar'
      ? 'متجر ملابس سريع يدعم العربية والإنجليزية، يحفظ السلة والثيم، ويعرض الأسعار بعملة SAR فقط.'
      : 'Fast fashion storefront with Arabic and English support, saved cart and theme, and SAR-only pricing.'

  document.title = title
  setMeta('description', description)
  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('twitter:title', title, 'name')
  setMeta('twitter:description', description, 'name')
  setMeta('theme-color', state.ui.theme === 'dark' ? '#05070c' : '#ffffff')
}

function renderProductMedia(product: Product, badge: string) {
  if (product.image.startsWith('data:image/')) {
    return `
      <div class="product-card__image media-card">
        <img src="${product.image}" alt="${badge}" loading="lazy" decoding="async" />
        <span>${badge}</span>
      </div>
    `
  }

  return `
    <div class="product-card__image media-card" style="background:${product.image}">
      <span>${badge}</span>
    </div>
  `
}

function renderProductSkeletons() {
  return Array.from({ length: 6 }, () => `
    <article class="product-card product-card--skeleton">
      <div class="product-card__image skeleton"></div>
      <div class="product-card__body">
        <div class="skeleton skeleton-line skeleton-line--short"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="sizes-row">
          <span class="skeleton skeleton-pill"></span>
          <span class="skeleton skeleton-pill"></span>
          <span class="skeleton skeleton-pill"></span>
        </div>
      </div>
    </article>
  `).join('')
}

function render() {
  const localizedCategories = getLocalizedCategories()
  const filteredProducts = getFilteredProducts()
  const cartItems = buildCartDetails()
  const cartTotal = getCartTotal()
  const allSizes = getAllSizes()

  applyLanguage(state.ui.lang)
  applyTheme(state.ui.theme)
  updateSeo()

  appRoot.innerHTML = `
    <div class="site-shell">
      <header class="topbar">
        <div class="topbar__content">
          <div class="brand-block">
            <span class="brand-tag">${t('brandTag')}</span>
            <h1>${t('headline')}</h1>
            <p>${t('subhead')}</p>
          </div>
          <div class="topbar__actions">
            <nav class="top-links" aria-label="${t('sectionsEyebrow')}">
              <a href="#products">${t('navProducts')}</a>
              <a href="#cart">${t('navCart')}</a>
            </nav>
            <button id="toggle-lang" class="tool-btn" type="button">${t('languageToggle')}</button>
            <button id="toggle-theme" class="tool-btn" type="button">${t('themeToggle')}</button>
          </div>
        </div>
      </header>

      <section class="hero-board">
        <div class="hero-main">
          <div class="hero-badge">${t('heroBadge')}</div>
          <h2>${t('heroTitle')}</h2>
          <p>${t('heroText')}</p>
          <div class="hero-actions">
            <button class="primary-btn" type="button" data-scroll="products">${t('heroPrimary')}</button>
            <button class="ghost-btn" type="button" data-scroll="categories">${t('heroSecondary')}</button>
          </div>
        </div>
        <div class="hero-highlights">
          <article class="highlight-card">
            <strong>${t('highlights1Title')}</strong>
            <p>${t('highlights1Text')}</p>
          </article>
          <article class="highlight-card">
            <strong>${t('highlights2Title')}</strong>
            <p>${t('highlights2Text')}</p>
          </article>
          <article class="highlight-card">
            <strong>${t('highlights3Title')}</strong>
            <p>${t('highlights3Text')}</p>
          </article>
        </div>
      </section>

      <section class="category-strip" id="categories">
        ${localizedCategories
          .map(
            (category) => `
              <button class="category-card" type="button" data-category="${category.id}" style="--accent:${category.accent}">
                <div class="category-card__circle">${escapeHtml(category.badge)}</div>
                <span>${escapeHtml(category.name)}</span>
                <small>${escapeHtml(category.subtitle)}</small>
              </button>
            `,
          )
          .join('')}
      </section>

      <main class="main-layout">
        <section class="catalog-column">
          <div class="section-head">
            <div>
              <span class="eyebrow">${t('sectionsEyebrow')}</span>
              <h3>${t('sectionsTitle')}</h3>
            </div>
            <strong class="section-count">${t('resultsCount')}: ${state.loading ? '—' : filteredProducts.length}</strong>
          </div>

          <section class="filters" id="products">
            <div class="filters__chips">
              <button class="${state.selectedCategory === 'all' ? 'active' : ''}" type="button" data-category="all">${t('filtersAll')}</button>
              ${localizedCategories
                .map(
                  (category) => `
                    <button class="${state.selectedCategory === category.id ? 'active' : ''}" type="button" data-category="${category.id}">
                      ${escapeHtml(category.name)}
                    </button>
                  `,
                )
                .join('')}
            </div>
            <label class="size-filter">
              <span>${t('sizeLabel')}</span>
              <select id="size-select">
                ${allSizes
                  .map(
                    (size) => `
                      <option value="${size}" ${state.selectedSize === size ? 'selected' : ''}>
                        ${size === 'all' ? t('sizeAll') : size}
                      </option>
                    `,
                  )
                  .join('')}
              </select>
            </label>
          </section>

          <section class="product-grid">
            ${
              state.loading
                ? renderProductSkeletons()
                : filteredProducts.length
                  ? filteredProducts
                      .map((product) => {
                        const displayProduct = getLocalizedProduct(product)
                        const displayCategory =
                          localizedCategories.find((category) => category.id === product.category)?.name ?? ''
                        const badge = escapeHtml(displayProduct.badge ?? t('defaultBadge'))

                        return `
                          <article class="product-card">
                            <button class="product-card__click" type="button" data-open-product="${product.id}" aria-label="${escapeHtml(displayProduct.name)}"></button>
                            ${renderProductMedia(product, badge)}
                            <div class="product-card__body">
                              <div class="product-card__meta">
                                <small>${escapeHtml(displayCategory)}</small>
                                <strong>${formatPrice(product.price)}</strong>
                              </div>
                              <h4>${escapeHtml(displayProduct.name)}</h4>
                              <p>${escapeHtml(displayProduct.description)}</p>
                              <div class="sizes-row">
                                ${product.sizes.map((size) => `<span>${size}</span>`).join('')}
                              </div>
                              <div class="product-card__actions">
                                <select data-size-for="${product.id}">
                                  ${product.sizes
                                    .map((size) => `<option value="${size}">${size}</option>`)
                                    .join('')}
                                </select>
                                <button class="ghost-inline-btn" type="button" data-open-product="${product.id}">${t('viewDetails')}</button>
                                <button class="primary-btn small" type="button" data-add-product="${product.id}">${t('addToCart')}</button>
                              </div>
                            </div>
                          </article>
                        `
                      })
                      .join('')
                  : `<div class="empty-card">${t('emptyProducts')}</div>`
            }
          </section>
        </section>

        <aside class="cart-column" id="cart">
          <section class="cart-panel">
            <div class="section-head compact">
              <div>
                <span class="eyebrow">${t('cartEyebrow')}</span>
                <h3>${t('cartTitle')}</h3>
              </div>
              <strong>${formatPrice(cartTotal)}</strong>
            </div>

            <div class="cart-items">
              ${
                cartItems.length
                  ? cartItems
                      .map(
                        (item) => `
                          <div class="cart-item">
                            <div>
                              <strong>${escapeHtml(item.name)}</strong>
                              <p>${t('cartSize')} ${item.size} × ${item.quantity}</p>
                            </div>
                            <div class="cart-item__controls">
                              <button type="button" data-cart-action="increase" data-product-id="${item.productId}" data-size="${item.size}">+</button>
                              <button type="button" data-cart-action="decrease" data-product-id="${item.productId}" data-size="${item.size}">-</button>
                              <button type="button" data-cart-action="remove" data-product-id="${item.productId}" data-size="${item.size}">${t('cartRemove')}</button>
                            </div>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="empty-state">${t('cartEmpty')}</p>`
              }
            </div>

            <div class="cart-total-row">
              <span>${t('cartTotal')}</span>
              <strong>${formatPrice(cartTotal)}</strong>
            </div>

            <form class="checkout-form" id="checkout-form">
              <label>
                <span>${t('customerName')}</span>
                <input name="customerName" value="${escapeHtml(state.checkout.customerName)}" placeholder="${t('customerNamePlaceholder')}" required />
              </label>
              <label>
                <span>${t('phone')}</span>
                <input name="phone" value="${escapeHtml(state.checkout.phone)}" placeholder="${t('phonePlaceholder')}" required />
              </label>
              <label>
                <span>${t('address')}</span>
                <textarea name="address" placeholder="${t('addressPlaceholder')}" required>${escapeHtml(state.checkout.address)}</textarea>
              </label>
              <label>
                <span>${t('notes')}</span>
                <textarea name="notes" placeholder="${t('notesPlaceholder')}">${escapeHtml(state.checkout.notes)}</textarea>
              </label>
              <button class="primary-btn checkout-btn" type="submit" ${state.submitting ? 'disabled' : ''}>
                ${state.submitting ? t('checkoutSending') : t('checkout')}
              </button>
              ${state.notice ? `<p class="notice">${escapeHtml(state.notice)}</p>` : ''}
            </form>
          </section>
        </aside>
      </main>

      <footer class="site-footer">
        <p>${t('footerText')}</p>
      </footer>
    </div>
  `

  bindEvents()
}

function bindEvents() {
  document.querySelector('#toggle-lang')?.addEventListener('click', () => {
    state.ui.lang = state.ui.lang === 'ar' ? 'en' : 'ar'
    localStorage.setItem(LANG_KEY, state.ui.lang)
    render()
  })

  document.querySelector('#toggle-theme')?.addEventListener('click', () => {
    state.ui.theme = state.ui.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, state.ui.theme)
    render()
  })

  document.querySelectorAll<HTMLElement>('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedCategory = (button.dataset.category as CategoryId | 'all') ?? 'all'
      render()
      scrollToId('products')
    })
  })

  document.querySelectorAll<HTMLElement>('[data-scroll]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.scroll
      if (target) {
        scrollToId(target)
      }
    })
  })

  document.querySelector('#size-select')?.addEventListener('change', (event) => {
    state.selectedSize = (event.target as HTMLSelectElement).value
    render()
  })

  document.querySelectorAll<HTMLElement>('[data-open-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.openProduct
      if (productId) {
        goToProduct(productId)
      }
    })
  })

  document.querySelectorAll<HTMLElement>('[data-add-product]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      const productId = button.dataset.addProduct
      if (!productId) return

      const selectedSize = document.querySelector<HTMLSelectElement>(`[data-size-for="${productId}"]`)
      const size = selectedSize?.value
      if (!size) return

      const existingItem = state.cart.find((item) => item.productId === productId && item.size === size)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.cart.unshift({ productId, size, quantity: 1 })
      }

      persistCart()
      state.notice = t('noticeAdded')
      render()
    })
  })

  document.querySelectorAll<HTMLElement>('[data-cart-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.cartAction
      const productId = button.dataset.productId
      const size = button.dataset.size

      state.cart = state.cart
        .map((item) => {
          if (item.productId !== productId || item.size !== size) return item
          if (action === 'increase') return { ...item, quantity: item.quantity + 1 }
          if (action === 'decrease') return { ...item, quantity: item.quantity - 1 }
          if (action === 'remove') return { ...item, quantity: 0 }
          return item
        })
        .filter((item) => item.quantity > 0)

      persistCart()
      state.notice = ''
      render()
    })
  })

  document
    .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.checkout-form input, .checkout-form textarea')
    .forEach((field) => {
      field.addEventListener('input', () => {
        state.checkout = {
          ...state.checkout,
          [field.name]: field.value,
        }
      })
    })

  document.querySelector('#checkout-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (!state.cart.length) {
      state.notice = t('noticeNeedProduct')
      render()
      return
    }

    if (!state.checkout.customerName || !state.checkout.phone || !state.checkout.address) {
      state.notice = t('noticeNeedCustomer')
      render()
      return
    }

    state.submitting = true
    state.notice = ''
    render()

    try {
      await createOrder({
        customerName: state.checkout.customerName,
        phone: state.checkout.phone,
        address: state.checkout.address,
        notes: state.checkout.notes,
        total: getCartTotal(),
        items: buildCartDetails(),
      })

      state.cart = []
      persistCart()
      state.checkout = {
        customerName: '',
        phone: '',
        address: '',
        notes: '',
      }
      state.notice = t('noticeSuccess')
    } catch {
      state.notice = t('noticeFail')
    } finally {
      state.submitting = false
      render()
    }
  })
}

async function bootstrap() {
  applyLanguage(state.ui.lang)
  applyTheme(state.ui.theme)
  render()

  try {
    state.products = await getProducts()
  } finally {
    state.loading = false
    render()
  }
}

void bootstrap()
