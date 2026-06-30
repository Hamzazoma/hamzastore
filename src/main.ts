import './style.css'
import { createOrder, getCategories, getProducts } from './api.ts'
import type { CartItem, CategoryId, Product } from './types.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root was not found')
}

const appRoot = app
const categories = getCategories()

const state: {
  products: Product[]
  cart: CartItem[]
  selectedCategory: CategoryId | 'all'
  selectedSize: string
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
  cart: [],
  selectedCategory: 'all',
  selectedSize: 'all',
  checkout: {
    customerName: '',
    phone: '',
    address: '',
    notes: '',
  },
  submitting: false,
  notice: '',
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
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

function buildCartDetails() {
  return state.cart
    .map((item) => {
      const product = findProduct(item.productId)
      if (!product) return null

      return {
        productId: product.id,
        name: product.name,
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

function render() {
  const filteredProducts = getFilteredProducts()
  const allSizes = ['all', ...new Set(state.products.flatMap((product) => product.sizes))]
  const cartItems = buildCartDetails()
  const cartTotal = getCartTotal()

  appRoot.innerHTML = `
    <div class="site-shell">
      <header class="topbar">
        <div class="topbar__inner">
          <div class="brand-block">
            <span class="brand-tag">متجر أزياء</span>
            <h1>ستايل قريب من الواجهة التي طلبتها</h1>
            <p>واجهة عربية مستوحاة من أسلوب المتاجر الكبيرة، مع أقسام واضحة وطلبات مرتبطة بلوحة الإدارة.</p>
          </div>
          <nav class="top-links">
            <a href="#products">المنتجات</a>
            <a href="#world-cup">منتخبات</a>
            <a href="admin.html">لوحة الإدارة</a>
          </nav>
        </div>
      </header>

      <section class="hero-board">
        <aside class="hero-menu">
          ${categories
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
          <div class="hero-badge">SHEIN style / Arabic landing</div>
          <h2>قسم منتخبات خاص بمناسبة كأس العالم</h2>
          <p>اضغط على أي قسم من الأعلى وسيتم نقلك مباشرة إلى المنتجات المناسبة له، مع فلترة المقاسات بسهولة.</p>
          <div class="hero-actions">
            <button class="primary-btn" data-category="world-cup">تسوق المنتخبات</button>
            <button class="ghost-btn" data-scroll="products">عرض كل المنتجات</button>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-promo">
            <span>رجال</span>
            <strong>تخفيضات حتى 30%</strong>
          </div>
          <div class="hero-promo alt">
            <span>جزم</span>
            <strong>موديلات جديدة</strong>
          </div>
          <div class="hero-promo soft">
            <span>أطفال</span>
            <strong>مقاسات متعددة</strong>
          </div>
        </div>
      </section>

      <section class="category-strip">
        ${categories
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
              <span class="eyebrow">الأقسام الرئيسية</span>
              <h3>رجال، سيدات، بنات، أطفال، جزم، ومنتخبات</h3>
            </div>
            <a class="admin-link" href="admin.html">فتح الإدارة</a>
          </div>

          <section class="filters" id="products">
            <div class="filters__chips">
              <button class="${state.selectedCategory === 'all' ? 'active' : ''}" data-category="all">الكل</button>
              ${categories
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
              <span>اختيار المقاس</span>
              <select id="size-select">
                ${allSizes
                  .map(
                    (size) => `
                      <option value="${size}" ${state.selectedSize === size ? 'selected' : ''}>
                        ${size === 'all' ? 'كل المقاسات' : size}
                      </option>
                    `,
                  )
                  .join('')}
              </select>
            </label>
          </section>

          <section class="product-grid">
            ${filteredProducts
              .map(
                (product) => `
                  <article class="product-card">
                    <div class="product-card__image" style="background:${product.image}">
                      <span>${product.badge ?? 'منتج'}</span>
                    </div>
                    <div class="product-card__body">
                      <div class="product-card__meta">
                        <small>${categories.find((category) => category.id === product.category)?.name ?? ''}</small>
                        <strong>${formatPrice(product.price)}</strong>
                      </div>
                      <h4>${product.name}</h4>
                      <p>${product.description}</p>
                      <div class="sizes-row">
                        ${product.sizes.map((size) => `<span>${size}</span>`).join('')}
                      </div>
                      <div class="product-card__actions">
                        <select data-size-for="${product.id}">
                          ${product.sizes
                            .map((size) => `<option value="${size}">${size}</option>`)
                            .join('')}
                        </select>
                        <button class="primary-btn small" data-add-product="${product.id}">أضف للسلة</button>
                      </div>
                    </div>
                  </article>
                `,
              )
              .join('')}
          </section>
        </section>

        <aside class="cart-column">
          <section class="cart-panel">
            <div class="section-head compact">
              <div>
                <span class="eyebrow">سلة العميل</span>
                <h3>الطلب الحالي</h3>
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
                              <p>مقاس ${item.size} × ${item.quantity}</p>
                            </div>
                            <div class="cart-item__controls">
                              <button data-cart-action="increase" data-product-id="${item.productId}" data-size="${item.size}">+</button>
                              <button data-cart-action="decrease" data-product-id="${item.productId}" data-size="${item.size}">-</button>
                              <button data-cart-action="remove" data-product-id="${item.productId}" data-size="${item.size}">حذف</button>
                            </div>
                          </div>
                        `,
                      )
                      .join('')
                  : '<p class="empty-state">السلة فارغة حاليًا. اختر منتجًا ومقاسًا لإضافته.</p>'
              }
            </div>

            <form class="checkout-form" id="checkout-form">
              <label>
                <span>اسم العميل</span>
                <input name="customerName" value="${state.checkout.customerName}" placeholder="اكتب الاسم" required />
              </label>
              <label>
                <span>رقم الهاتف</span>
                <input name="phone" value="${state.checkout.phone}" placeholder="01xxxxxxxxx" required />
              </label>
              <label>
                <span>العنوان</span>
                <textarea name="address" placeholder="المدينة - المنطقة - الشارع" required>${state.checkout.address}</textarea>
              </label>
              <label>
                <span>ملاحظات</span>
                <textarea name="notes" placeholder="أي تفاصيل إضافية">${state.checkout.notes}</textarea>
              </label>
              <button class="primary-btn checkout-btn" type="submit" ${state.submitting ? 'disabled' : ''}>
                ${state.submitting ? 'جارٍ إرسال الطلب...' : 'تأكيد الطلب'}
              </button>
              ${state.notice ? `<p class="notice">${state.notice}</p>` : ''}
            </form>
          </section>
        </aside>
      </main>
    </div>
  `

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

  document.querySelectorAll<HTMLElement>('[data-add-product]').forEach((button) => {
    button.addEventListener('click', () => {
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

      render()
    })
  })

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.checkout-form input, .checkout-form textarea')
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
      state.notice = 'أضف منتجًا واحدًا على الأقل قبل تأكيد الطلب.'
      render()
      return
    }

    if (!state.checkout.customerName || !state.checkout.phone || !state.checkout.address) {
      state.notice = 'من فضلك أكمل بيانات العميل الأساسية.'
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
      state.checkout = {
        customerName: '',
        phone: '',
        address: '',
        notes: '',
      }
      state.notice = 'تم إرسال الطلب بنجاح، وستراه فورًا داخل لوحة الإدارة.'
    } catch {
      state.notice = 'حدثت مشكلة أثناء إرسال الطلب. جرّب مرة أخرى.'
    } finally {
      state.submitting = false
      render()
    }
  })
}

async function bootstrap() {
  state.products = await getProducts()
  render()
}

bootstrap()
