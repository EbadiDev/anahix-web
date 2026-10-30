import { useSyncExternalStore } from 'react'
import type { CartItem, CouponValidation, Product, ProductPlan } from '../types'

const CART_STORAGE_KEY = 'anahix_cart_state'

interface CartState {
  items: CartItem[]
  coupon: CouponValidation | null
}

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.items)) {
        return {
          items: parsed.items,
          coupon: parsed.coupon || null,
        }
      }
    }
  } catch {}
  return { items: [], coupon: null }
}

let globalState: CartState = loadInitialState()
const listeners = new Set<(state: CartState) => void>()

function notify() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(globalState))
  for (const listener of listeners) {
    listener(globalState)
  }
}

export const cartStore = {
  getState(): CartState {
    return globalState
  },

  addItem(product: Product, quantity = 1, plan?: ProductPlan) {
    // Prevent adding out-of-stock items to cart
    const isOutOfStock =
      product.stock_mode === 'out_of_stock' ||
      product.is_out_of_stock ||
      (product.stock_mode !== 'always_in_stock' &&
        product.available_stock !== undefined &&
        product.available_stock <= 0)
    if (isOutOfStock) {
      return false
    }

    const planId = plan?.id || ''
    const existingIndex = globalState.items.findIndex(
      (item) =>
        String(item.product.id) === String(product.id) &&
        (item.plan?.id || '') === planId,
    )
    if (existingIndex > -1) {
      const updated = [...globalState.items]
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      }
      globalState = { ...globalState, items: updated }
    } else {
      globalState = {
        ...globalState,
        items: [...globalState.items, { product, quantity, plan }],
      }
    }
    notify()
  },

  removeItem(productId: string | number, planId?: string) {
    globalState = {
      ...globalState,
      items: globalState.items.filter((item) => {
        const matchesProduct = String(item.product.id) === String(productId)
        if (!matchesProduct) return true
        if (planId !== undefined) {
          return (item.plan?.id || '') !== planId
        }
        return false
      }),
    }
    notify()
  },

  updateQuantity(
    productId: string | number,
    quantity: number,
    planId?: string,
  ) {
    if (quantity <= 0) {
      cartStore.removeItem(productId, planId)
      return
    }
    globalState = {
      ...globalState,
      items: globalState.items.map((item) => {
        const matchesProduct = String(item.product.id) === String(productId)
        const matchesPlan =
          planId === undefined || (item.plan?.id || '') === planId
        if (matchesProduct && matchesPlan) {
          return { ...item, quantity }
        }
        return item
      }),
    }
    notify()
  },

  applyCoupon(coupon: CouponValidation) {
    globalState = { ...globalState, coupon }
    notify()
  },

  removeCoupon() {
    globalState = { ...globalState, coupon: null }
    notify()
  },

  clearCart() {
    globalState = { items: [], coupon: null }
    notify()
  },

  subscribe(listener: (state: CartState) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useCart() {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getState,
    cartStore.getState,
  )

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, item) =>
      sum +
      (item.plan?.price_toman ?? item.product.price_toman) * item.quantity,
    0,
  )

  let discount = 0
  if (state.coupon?.valid) {
    if (state.coupon.discount_type === 'percentage') {
      discount = (subtotal * state.coupon.discount_value) / 100
    } else {
      discount = state.coupon.discount_value
    }
    if (discount > subtotal) discount = subtotal
  }

  const total = Math.max(0, subtotal - discount)

  return {
    items: state.items,
    coupon: state.coupon,
    itemCount,
    subtotal,
    discount,
    total,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    applyCoupon: cartStore.applyCoupon,
    removeCoupon: cartStore.removeCoupon,
    clearCart: cartStore.clearCart,
  }
}

/**
 * Optimized granular selector hook for ProductCard instances
 */
export function useCartItemQuantity(
  productId: string | number,
  planId?: string,
): number {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getState,
    cartStore.getState,
  )
  const item = state.items.find((it) => {
    const matchProd = String(it.product.id) === String(productId)
    if (!matchProd) return false
    if (planId !== undefined) {
      return (it.plan?.id || '') === planId
    }
    return true
  })
  return item ? item.quantity : 0
}
