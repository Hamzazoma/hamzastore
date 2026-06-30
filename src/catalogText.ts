import type { Category, CategoryId, Product } from './types.ts'

export type Lang = 'ar' | 'en'

const categoryText: Record<
  CategoryId,
  {
    ar: { name: string; subtitle: string }
    en: { name: string; subtitle: string }
  }
> = {
  'world-cup': {
    ar: { name: 'منتخبات', subtitle: 'قسم خاص بمناسبة كأس العالم' },
    en: { name: 'Teams', subtitle: 'Special World Cup collection' },
  },
  men: {
    ar: { name: 'رجال', subtitle: 'ستايل يومي ورياضي' },
    en: { name: 'Men', subtitle: 'Daily and sporty style' },
  },
  women: {
    ar: { name: 'سيدات', subtitle: 'فساتين ولوك عصري' },
    en: { name: 'Women', subtitle: 'Dresses and modern looks' },
  },
  girls: {
    ar: { name: 'بنات', subtitle: 'ألوان مرحة وموديلات ناعمة' },
    en: { name: 'Girls', subtitle: 'Playful colors and soft fits' },
  },
  kids: {
    ar: { name: 'أطفال', subtitle: 'مريح وعملي للحركة' },
    en: { name: 'Kids', subtitle: 'Comfortable and easy to move in' },
  },
  shoes: {
    ar: { name: 'جزم', subtitle: 'كاجوال وسبورت' },
    en: { name: 'Shoes', subtitle: 'Casual and sporty' },
  },
}

const productText: Record<
  string,
  {
    ar: { name: string; description: string; badge?: string }
    en: { name: string; description: string; badge?: string }
  }
> = {
  'wc-arg-home': {
    ar: {
      name: 'طقم الأرجنتين الأساسي',
      description: 'قماش خفيف مناسب للمباريات والتشجيع، مع تفاصيل مستوحاة من النسخة الرسمية.',
      badge: 'الأكثر طلبًا',
    },
    en: {
      name: 'Argentina home kit',
      description: 'Lightweight fabric for match days and fanwear with details inspired by the official version.',
      badge: 'Best seller',
    },
  },
  'wc-brazil-away': {
    ar: {
      name: 'تيشيرت البرازيل الاحتياطي',
      description: 'تصميم ملفت بدرجات الأزرق، مناسب للمشجعين ومحبي الستايل الرياضي.',
      badge: 'كأس العالم',
    },
    en: {
      name: 'Brazil away shirt',
      description: 'Bold blue shades for fans who love sporty street style.',
      badge: 'World Cup',
    },
  },
  'men-urban-set': {
    ar: {
      name: 'طقم رجالي كاجوال',
      description: 'قصة مريحة وخامة ناعمة مناسبة للخروج اليومي.',
      badge: 'رجالي',
    },
    en: {
      name: 'Men casual set',
      description: 'Relaxed fit with a soft feel for daily outings.',
      badge: 'Men',
    },
  },
  'women-elegant-dress': {
    ar: {
      name: 'فستان سيدات أنيق',
      description: 'فستان ناعم بمظهر راقٍ مناسب للمشاوير والمناسبات الخفيفة.',
      badge: 'وصل جديد',
    },
    en: {
      name: 'Elegant women dress',
      description: 'Soft and refined dress for outings and light occasions.',
      badge: 'New in',
    },
  },
  'girls-bloom-set': {
    ar: {
      name: 'طقم بنات مزهر',
      description: 'ألوان مبهجة وقماش مناسب للحركة واللعب.',
      badge: 'بنات',
    },
    en: {
      name: 'Floral girls set',
      description: 'Cheerful colors and easy fabric for movement and play.',
      badge: 'Girls',
    },
  },
  'kids-soft-pack': {
    ar: {
      name: 'باك أطفال صيفي',
      description: 'قطعتان بخامة قطنية مريحة للأيام الطويلة.',
      badge: 'أطفال',
    },
    en: {
      name: 'Kids summer pack',
      description: 'Two-piece cotton set made for long comfortable days.',
      badge: 'Kids',
    },
  },
  'shoes-white-run': {
    ar: {
      name: 'كوتشي أبيض كلاسيك',
      description: 'حذاء عملي يناسب اللبس اليومي واللوك الرياضي.',
      badge: 'جزم',
    },
    en: {
      name: 'Classic white sneakers',
      description: 'Easy everyday pair that works with casual and sporty outfits.',
      badge: 'Shoes',
    },
  },
  'women-casual-set': {
    ar: {
      name: 'طقم سيدات مريح',
      description: 'ستايل بسيط وأنيق، مناسب للشغل والخروجات السريعة.',
      badge: 'سيدات',
    },
    en: {
      name: 'Comfort women set',
      description: 'Simple, polished style for work and quick outings.',
      badge: 'Women',
    },
  },
}

export function localizeCategory(category: Category, lang: Lang): Category {
  const text = categoryText[category.id]?.[lang]

  if (!text) {
    return category
  }

  return {
    ...category,
    name: text.name,
    subtitle: text.subtitle,
  }
}

export function localizeProduct(product: Product, lang: Lang): Product {
  const text = productText[product.id]?.[lang]

  if (!text) {
    return product
  }

  return {
    ...product,
    name: text.name,
    description: text.description,
    badge: text.badge ?? product.badge,
  }
}
