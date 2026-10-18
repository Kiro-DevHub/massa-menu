// Перенесено 1-в-1 из reference/menu-reference.html. Паритет проверяет src/data/data-parity.test.ts.
import type { Product } from './types'

export const CATEGORIES = ["Мясо и рыба", "Крупы и макароны", "Хлеб и лаваш", "Молочка и яйца", "Фрукты и овощи", "Перекусы и напитки", "Соусы и бакалея"] as const

const PRODUCT_DATA = {
  chicken: { name: "Куриная грудка", unit: "г", cat: 0, meat: true, step: 50 },
  beefMince: { name: "Говяжий фарш 10%", unit: "г", cat: 0, meat: true, step: 50 },
  beef: { name: "Говядина (лопатка)", unit: "г", cat: 0, meat: true, step: 50 },
  chickenMince: { name: "Куриный фарш", unit: "г", cat: 0, meat: true, step: 50 },
  pork: { name: "Свиная вырезка", unit: "г", cat: 0, meat: true, step: 50 },
  salmon: { name: "Горбуша, филе", unit: "г", cat: 0, meat: true, step: 50 },
  ham: { name: "Ветчина", unit: "г", cat: 0, pack: 200 },
  rice: { name: "Рис", unit: "г", cat: 1, pack: 900 },
  pasta: { name: "Паста (твёрдые сорта)", unit: "г", cat: 1, pack: 450 },
  bulgur: { name: "Булгур", unit: "г", cat: 1, pack: 500 },
  udon: { name: "Лапша удон", unit: "г", cat: 1, pack: 300 },
  bread: { name: "Хлеб / батон", unit: "г", cat: 2, pack: 400 },
  lavash: { name: "Лаваш тонкий", unit: "г", cat: 2, pack: 200 },
  eggs: { name: "Яйца", unit: "шт", cat: 3, pack: 10 },
  cheese: { name: "Сыр твёрдый", unit: "г", cat: 3, pack: 200 },
  milk: { name: "Молоко 2,5%", unit: "мл", cat: 3, pack: 900 },
  yogurtDrink: { name: "Питьевой йогурт 250 г", unit: "шт", cat: 3, pack: 1 },
  cottage: { name: "Творог 5%", unit: "г", cat: 3, pack: 200 },
  creamCheese: { name: "Творожный сыр", unit: "г", cat: 3, pack: 140 },
  cream: { name: "Сливки 10%", unit: "мл", cat: 3, pack: 200 },
  plainYogurt: { name: "Йогурт без добавок (для соуса)", unit: "г", cat: 3, pack: 250 },
  banana: { name: "Бананы", unit: "шт", cat: 4, pack: 1 },
  apple: { name: "Яблоки", unit: "шт", cat: 4, pack: 1 },
  veg: { name: "Огурцы и помидоры", unit: "г", cat: 4, step: 100 },
  juice: { name: "Сок", unit: "мл", cat: 5, pack: 1000 },
  cookies: { name: "Печенье", unit: "г", cat: 5, pack: 200 },
  nuts: { name: "Орехи", unit: "г", cat: 5, pack: 150 },
  peanut: { name: "Арахисовая паста", unit: "г", cat: 5, pack: 300 },
  sushki: { name: "Сушки", unit: "г", cat: 5, pack: 200 },
  protein: { name: "Протеин", unit: "г", cat: 5, pack: 900 },
  tomatoSauce: { name: "Томатный соус (пассата)", unit: "г", cat: 6, pack: 500 },
  teriyaki: { name: "Соус терияки", unit: "г", cat: 6, staple: true },
  soy: { name: "Соевый соус", cat: 6, staple: true },
  chili: { name: "Сладкий чили", cat: 6, staple: true },
  tomatoPaste: { name: "Томатная паста", cat: 6, staple: true },
  oil: { name: "Масло растительное", unit: "г", cat: 6, staple: true },
  flour: { name: "Мука", unit: "г", cat: 6, staple: true },
  sugar: { name: "Сахар", unit: "г", cat: 6, staple: true },
  spices: { name: "Соль и специи", cat: 6, staple: true },
  onion: { name: "Лук", cat: 4, staple: true },
  garlic: { name: "Чеснок", cat: 4, staple: true },
  lemon: { name: "Лимон", cat: 4, staple: true },
  honey: { name: "Мёд", unit: "г", cat: 6, staple: true },
  condensed: { name: "Сгущёнка", unit: "г", cat: 6, staple: true },
  nutella: { name: "Нутелла", unit: "г", cat: 6, staple: true },
} satisfies Record<string, Product>

export type ProductId = keyof typeof PRODUCT_DATA

export const PRODUCTS: Readonly<Record<ProductId, Product>> = PRODUCT_DATA
