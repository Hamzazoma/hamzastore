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
  const isArabic = lang === 'ar'
  const name = isArabic ? product.nameAr ?? product.name : product.nameEn ?? product.name
  const description = isArabic
    ? product.descriptionAr ?? product.description
    : product.descriptionEn ?? product.description
  const badge = isArabic ? product.badgeAr ?? product.badge : product.badgeEn ?? product.badge

  return {
    ...product,
    name,
    description,
    badge,
  }
}
