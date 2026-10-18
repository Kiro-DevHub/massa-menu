import type { SVGProps } from 'react'

// Иконки табов: один штрих 1.8, скруглённые концы, кухонные предметы.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

/** Тарелка с вилкой и ножом. */
export const PlateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M2 4v5.5M2 7h0M22 4c-1.3 1-1.6 2.6-1.6 5h1.6v11" />
  </svg>
)

/** Кастрюля с паром. */
export const PotIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.5 10.5h15v6.5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3z" />
    <path d="M2 10.5h2.5M19.5 10.5H22M9 3.5c0 1-1 1.5-1 2.5s1 1.5 1 2.5M13 3.5c0 1-1 1.5-1 2.5s1 1.5 1 2.5M17 3.5c0 1-1 1.5-1 2.5s1 1.5 1 2.5" />
  </svg>
)

/** Холодильник. */
export const FridgeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M5 9.5h14M8.5 5.5v1.6M8.5 12.5v3.5" />
  </svg>
)

/** Пакет с ручками. */
export const BagIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M5 8h14l-1.1 11.2a2 2 0 0 1-2 1.8H8.1a2 2 0 0 1-2-1.8z" />
    <path d="M9 10.5V6.5a3 3 0 0 1 6 0v4" />
  </svg>
)

/** Напольные весы. */
export const ScaleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <path d="M8 10a5 5 0 0 1 8 0M12 10l1.6-2.2" />
  </svg>
)

/** Галочка для «Съел»: штрих рисуется анимацией через pathLength. */
export const CHECK_PATH = 'M5 12.5l4.5 4.5L19 7.5'
