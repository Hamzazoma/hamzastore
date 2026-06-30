import type { Category, Product } from './types.ts'

export const categories: Category[] = [
  {
    id: 'world-cup',
    name: 'منتخبات',
    subtitle: 'قسم خاص بمناسبة كأس العالم',
    accent: '#0d6f3c',
    badge: 'WC',
  },
  {
    id: 'men',
    name: 'رجال',
    subtitle: 'ستايل يومي ورياضي',
    accent: '#1d3557',
    badge: 'M',
  },
  {
    id: 'women',
    name: 'سيدات',
    subtitle: 'فساتين ولوك عصري',
    accent: '#7b2cbf',
    badge: 'W',
  },
  {
    id: 'girls',
    name: 'بنات',
    subtitle: 'ألوان مرحة وموديلات ناعمة',
    accent: '#ff6b9d',
    badge: 'G',
  },
  {
    id: 'kids',
    name: 'أطفال',
    subtitle: 'مريح وعملي للحركة',
    accent: '#ff9f1c',
    badge: 'K',
  },
  {
    id: 'shoes',
    name: 'جزم',
    subtitle: 'كاجوال وسبورت',
    accent: '#2a9d8f',
    badge: 'S',
  },
]

export const defaultProducts: Product[] = [
  {
    id: 'wc-arg-home',
    name: 'طقم الأرجنتين الأساسي',
    category: 'world-cup',
    price: 1190,
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'قماش خفيف مناسب للمباريات والتشجيع، مع تفاصيل مستوحاة من النسخة الرسمية.',
    badge: 'الأكثر طلبًا',
    image:
      'linear-gradient(135deg, #0f172a 0%, #1d4ed8 35%, #93c5fd 100%)',
    createdAt: '2026-06-30T10:00:00.000Z',
  },
  {
    id: 'wc-brazil-away',
    name: 'تيشيرت البرازيل الاحتياطي',
    category: 'world-cup',
    price: 980,
    sizes: ['M', 'L', 'XL'],
    description: 'تصميم ملفت بدرجات الأزرق، مناسب للمشجعين ومحبي الستايل الرياضي.',
    badge: 'كأس العالم',
    image:
      'linear-gradient(135deg, #012a4a 0%, #0096c7 40%, #90e0ef 100%)',
    createdAt: '2026-06-30T10:05:00.000Z',
  },
  {
    id: 'men-urban-set',
    name: 'طقم رجالي كاجوال',
    category: 'men',
    price: 760,
    sizes: ['M', 'L', 'XL', '2XL'],
    description: 'قصة مريحة وخامة ناعمة مناسبة للخروج اليومي.',
    badge: 'رجالي',
    image:
      'linear-gradient(135deg, #111827 0%, #374151 45%, #9ca3af 100%)',
    createdAt: '2026-06-30T10:10:00.000Z',
  },
  {
    id: 'women-elegant-dress',
    name: 'فستان سيدات أنيق',
    category: 'women',
    price: 1350,
    sizes: ['S', 'M', 'L'],
    description: 'فستان ناعم بمظهر راقٍ مناسب للمشاوير والمناسبات الخفيفة.',
    badge: 'وصل جديد',
    image:
      'linear-gradient(135deg, #3d1f58 0%, #b5179e 45%, #f9bec7 100%)',
    createdAt: '2026-06-30T10:15:00.000Z',
  },
  {
    id: 'girls-bloom-set',
    name: 'طقم بنات مزهر',
    category: 'girls',
    price: 540,
    sizes: ['4Y', '6Y', '8Y', '10Y'],
    description: 'ألوان مبهجة وقماش مناسب للحركة واللعب.',
    badge: 'بنات',
    image:
      'linear-gradient(135deg, #ff4d8d 0%, #ff85a1 40%, #ffd6e0 100%)',
    createdAt: '2026-06-30T10:20:00.000Z',
  },
  {
    id: 'kids-soft-pack',
    name: 'باك أطفال صيفي',
    category: 'kids',
    price: 620,
    sizes: ['2Y', '4Y', '6Y', '8Y'],
    description: 'قطعتان بخامة قطنية مريحة للأيام الطويلة.',
    badge: 'أطفال',
    image:
      'linear-gradient(135deg, #f77f00 0%, #fcbf49 50%, #ffe8a1 100%)',
    createdAt: '2026-06-30T10:25:00.000Z',
  },
  {
    id: 'shoes-white-run',
    name: 'كوتشي أبيض كلاسيك',
    category: 'shoes',
    price: 890,
    sizes: ['39', '40', '41', '42', '43'],
    description: 'حذاء عملي يناسب اللبس اليومي واللوك الرياضي.',
    badge: 'جزم',
    image:
      'linear-gradient(135deg, #0f172a 0%, #475569 40%, #e2e8f0 100%)',
    createdAt: '2026-06-30T10:30:00.000Z',
  },
  {
    id: 'women-casual-set',
    name: 'طقم سيدات مريح',
    category: 'women',
    price: 840,
    sizes: ['M', 'L', 'XL'],
    description: 'ستايل بسيط وأنيق، مناسب للشغل والخروجات السريعة.',
    badge: 'سيدات',
    image:
      'linear-gradient(135deg, #5f0f40 0%, #9a031e 45%, #ffb5a7 100%)',
    createdAt: '2026-06-30T10:35:00.000Z',
  },
]
