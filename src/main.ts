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
    brandTag: 'متجر أزياء',
    headline: 'واجهة متجر بسيطة وسريعة',
    subhead: 'تسوق بسهولة، واختَر المقاس، وأرسل الطلب مباشرة. يمكنك فتح صفحة كل منتج على حدة.',
    navProducts: 'المنتجات',
    navWorldCup: 'منتخبات',
    toggleLang: 'English',
    toggleThemeLight: 'لايت',
    toggleThemeDark: 'دارك',
    heroBadge: 'واجهة متجر',
    heroTitle: 'قسم منتخبات خاص بمناسبة كأس العالم',
    heroText: 'اضغط على أي قسم من الأعلى وسيتم نقلك مباشرة إلى المنتجات المناسبة له، مع فلترة المقاسات بسهولة.',
    heroShop: 'تسوق المنتخبات',
    heroAll: 'عرض كل المنتجات',
    promoMen: 'رجال',
    promoMenText: 'تخفيضات حتى 30%',
    promoShoes: 'جزم',
    promoShoesText: 'موديلات جديدة',
    promoKids: 'أطفال',
    promoKidsText: 'مقاسات متعددة',
    sectionsEyebrow: 'الأقسام الرئيسية',
    sectionsTitle: 'رجال، سيدات، بنات، أطفال، جزم، ومنتخبات',
    filtersAll: 'الكل',
    sizeLabel: 'اختيار المقاس',
    sizeAll: 'كل المقاسات',
    addToCart: 'أضف للسلة',
    viewDetails: 'عرض التفاصيل',
    cartEyebrow: 'سلة العميل',
    cartTitle: 'الطلب الحالي',
    cartEmpty: 'السلة فارغة حاليًا. اختر منتجًا ومقاسًا لإضافته.',
    cartSize: 'مقاس',
    cartRemove: 'حذف',
    customerName: 'اسم العميل',
    customerNamePlaceholder: 'اكتب الاسم',
    phone: 'رقم الهاتف',
    phonePlaceholder: '05xxxxxxxx',
    address: 'العنوان',
    addressPlaceholder: 'المدينة - الحي - الشارع',
    notes: 'ملاحظات',
    notesPlaceholder: 'أي تفاصيل إضافية',
    checkout: 'تأكيد الطلب',
    checkoutSending: 'جارٍ إرسال الطلب...',
    noticeNeedProduct: 'أضف منتجًا واحدًا على الأقل قبل تأكيد الطلب.',
    noticeNeedCustomer: 'من فضلك أكمل بيانات العميل الأساسية.',
    noticeSuccess: 'تم إرسال الطلب بنجاح، وستراه فورًا داخل لوحة الإدارة.',
    noticeFail: 'حدثت مشكلة أثناء إرسال الطلب. جرّب مرة أخرى.',
    defaultBadge: 'منتج',
  },
  en: {
    brandTag: 'Fashion Store',
    headline: 'Simple & fast storefront',
    subhead: 'Shop easily, pick a size, and open each product on its own details page.',
    navProducts: 'Products',
    navWorldCup: 'Teams',
    toggleLang: 'العربية',
    toggleThemeLight: 'Light',
    toggleThemeDark: 'Dark',
    heroBadge: 'Storefront',
    heroTitle: 'World Cup teams collection',
    heroText: 'Tap any category to jump to matching products and filter sizes easily.',
    heroShop: 'Shop teams',
    heroAll: 'View all products',
    promoMen: 'Men',
    promoMenText: 'Up to 30% off',
    promoShoes: 'Shoes',
    promoShoesText: 'New arrivals',
    promoKids: 'Kids',
    promoKidsText: 'Many sizes',
    sectionsEyebrow: 'Main categories',
    sectionsTitle: 'Men, Women, Girls, Kids, Shoes, and Teams',
    filtersAll: 'All',
    sizeLabel: 'Size',
    sizeAll: 'All sizes',
    addToCart: 'Add to cart',
    viewDetails: 'View details',
    cartEyebrow: 'Cart',
    cartTitle: 'Current order',
    cartEmpty: 'Your cart is empty. Pick a product and a size.',
    cartSize: 'Size',
    cartRemove: 'Remove',
    customerName: 'Customer name',
    customerNamePlaceholder: 'Type your name',
    phone: 'Phone number',
    phonePlaceholder: '05xxxxxxxx',
    address: 'Address',
    addressPlaceholder: 'City - district - street',
    notes: 'Notes',
    notesPlaceholder: 'Any extra details',
    checkout: 'Place order',
    checkoutSending: 'Sending...',
    noticeNeedProduct: 'Please add at least one item before placing the order.',
    noticeNeedCustomer: 'Please fill in the required customer details.',
    noticeSuccess: 'Order sent successfully. You will see it in the Admin panel.',
    noticeFail: 'Something went wrong while sending the order. Please try again.',
    defaultBadge: 'Product',
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
  submitting: false,
  notice: '',
}

function t(key: keyof (typeof messages)['ar']) {
  return messages[state.ui.lang][key] ?? messages.ar[key] ?? String(key)
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

function scrollToProducts() {
  document.querySelector('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goToProduct(productId: string) {
  window.location.href = `product.html?id=${encodeURIComponent(productId)}`
}

function render() {
  const localizedCategories = getLocalizedCategories()
  const filteredProducts = getFilteredProducts()
  const allSizes = ['all', ...new Set(state.products.flatMap((product) => product.sizes))]
  const cartItems = buildCartDetails()
  const cartTotal = getCartTotal()

  applyLanguage(state.ui.lang)
  applyTheme(state.ui.theme)

  appRoot.innerHTML = `
    <div class="site-shell">
      <header class="topbar">
        <div class="topbar__inner">
          <div class="brand-block">
            <span class="brand-tag">${t('brandTag')}</span>
            <h1>${t('headline')}</h1>
            <p>${t('subhead')}</p>
          </div>
          <div class="topbar__right">
            <nav class="top-links">
              <a href="#products">${t('navProducts')}</a>
              <a href="#world-cup">${t('navWorldCup')}</a>
            </nav>
            <div class="topbar__actions">
              <button id="toggle-lang" class="tool-btn" type="button">${t('toggleLang')}</button>
              <button id="toggle-theme" class="tool-btn" type="button">
                ${state.ui.theme === 'dark' ? t('toggleThemeLight') : t('toggleThemeDark')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="hero-board">
        <aside class="hero-menu">
          ${localizedCategories
            .map(
              (category) => `
                <button class="hero-menu__item" data-category="${category.id}" style="--accent:${category.accent}">
                  <span>${category.name}</span>
                  <small>${category.subtitle}</small>
                </button>
              `,
            )
            .join('')}
        </aside>

        <div class="hero-main" id="world-cup">
          <div class="hero-badge">${t('heroBadge')}</div>
          <h2>${t('heroTitle')}</h2>
          <p>${t('heroText')}</p>
          <div class="hero-actions">
            <button class="primary-btn" data-category="world-cup">${t('heroShop')}</button>
            <button class="ghost-btn" data-scroll="products">${t('heroAll')}</button>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-promo">
            <span>${t('promoMen')}</span>
            <strong>${t('promoMenText')}</strong>
          </div>
          <div class="hero-promo alt">
            <span>${t('promoShoes')}</span>
            <strong>${t('promoShoesText')}</strong>
          </div>
          <div class="hero-promo soft">
            <span>${t('promoKids')}</span>
            <strong>${t('promoKidsText')}</strong>
          </div>
        </div>
      </section>

      <section class="category-strip">
        ${localizedCategories
          .map(
            (category) => `
              <button class="category-card" data-category="${category.id}" style="--accent:${category.accent}">
                <div class="category-card__circle">${category.badge}</div>
                <span>${category.name}</span>
                <small>${category.subtitle}</small>
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
          </div>

          <section class="filters" id="products">
            <div class="filters__chips">
              <button class="${state.selectedCategory === 'all' ? 'active' : ''}" data-category="all">${t('filtersAll')}</button>
              ${localizedCategories
                .map(
                  (category) => `
                    <button class="${state.selectedCategory === category.id ? 'active' : ''}" data-category="${category.id}">
                      ${category.name}
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
            ${filteredProducts
              .map((product) => {
                const displayProduct = getLocalizedProduct(product)
                const displayCategory =
                  localizedCategories.find((category) => category.id === product.category)?.name ?? ''

                return `
                  <article class="product-card" data-open-product="${product.id}">
                    <button class="product-card__click" type="button" data-open-product="${product.id}" aria-label="${displayProduct.name}"></button>
                    <div class="product-card__image" style="background:${product.image}">
                      <span>${displayProduct.badge ?? t('defaultBadge')}</span>
                    </div>
                    <div class="product-card__body">
                      <div class="product-card__meta">
                        <small>${displayCategory}</small>
                        <strong>${formatPrice(product.price)}</strong>
                      </div>
                      <h4>${displayProduct.name}</h4>
                      <p>${displayProduct.description}</p>
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
                        <button class="primary-btn small" data-add-product="${product.id}">${t('addToCart')}</button>
                      </div>
                    </div>
                  </article>
                `
              })
              .join('')}
          </section>
        </section>

        <aside class="cart-column">
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
                              <strong>${item.name}</strong>
                              <p>${t('cartSize')} ${item.size} × ${item.quantity}</p>
                            </div>
                            <div class="cart-item__controls">
                              <button data-cart-action="increase" data-product-id="${item.productId}" data-size="${item.size}">+</button>
                              <button data-cart-action="decrease" data-product-id="${item.productId}" data-size="${item.size}">-</button>
                              <button data-cart-action="remove" data-product-id="${item.productId}" data-size="${item.size}">${t('cartRemove')}</button>
                            </div>
                          </div>
                        `,
                      )
                      .join('')
                  : `<p class="empty-state">${t('cartEmpty')}</p>`
              }
            </div>

            <form class="checkout-form" id="checkout-form">
              <label>
                <span>${t('customerName')}</span>
                <input name="customerName" value="${state.checkout.customerName}" placeholder="${t('customerNamePlaceholder')}" required />
              </label>
              <label>
                <span>${t('phone')}</span>
                <input name="phone" value="${state.checkout.phone}" placeholder="${t('phonePlaceholder')}" required />
              </label>
              <label>
                <span>${t('address')}</span>
                <textarea name="address" placeholder="${t('addressPlaceholder')}" required>${state.checkout.address}</textarea>
              </label>
              <label>
                <span>${t('notes')}</span>
                <textarea name="notes" placeholder="${t('notesPlaceholder')}">${state.checkout.notes}</textarea>
              </label>
              <button class="primary-btn checkout-btn" type="submit" ${state.submitting ? 'disabled' : ''}>
                ${state.submitting ? t('checkoutSending') : t('checkout')}
              </button>
              ${state.notice ? `<p class="notice">${state.notice}</p>` : ''}
            </form>
          </section>
        </aside>
      </main>
    </div>
  `

  document.querySelector('#toggle-lang')?.addEventListener('click', () => {
    state.ui.lang = state.ui.lang === 'ar' ? 'en' : 'ar'
    localStorage.setItem(LANG_KEY, state.ui.lang)
    render()
  })

  document.querySelector('#toggle-theme')?.addEventListener('click', () => {
    state.ui.theme = state.ui.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, state.ui.theme)
    applyTheme(state.ui.theme)
    render()
  })

  document.querySelectorAll<HTMLElement>('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextCategory = button.dataset.category as CategoryId | 'all'
      state.selectedCategory = nextCategory
      render()
      scrollToProducts()
    })
  })

  document.querySelector('[data-scroll="products"]')?.addEventListener('click', () => {
    scrollToProducts()
  })

  document.querySelector('#size-select')?.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement
    state.selectedSize = target.value
    render()
  })

  document.querySelectorAll<HTMLElement>('[data-open-product]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const target = event.currentTarget as HTMLElement
      const productId = target.dataset.openProduct
      if (!productId) return
      goToProduct(productId)
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

      const existingItem = state.cart.find(
        (item) => item.productId === productId && item.size === size,
      )

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.cart.unshift({ productId, size, quantity: 1 })
      }

      persistCart()
      state.notice = ''
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
  state.products = await getProducts()
  render()
}

void bootstrap()
