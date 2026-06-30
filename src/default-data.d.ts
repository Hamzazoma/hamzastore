declare module '../shared/default-data.mjs' {
  import type { Category, Product } from './types.ts'

  export const categories: Category[]
  export const defaultProducts: Product[]
}
