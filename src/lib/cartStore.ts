import { useEffect, useState } from 'react'
import type { CartItem, CouponValidation, Product } from '../types'

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

  addItem(product: Product, quantity = 1) {
    const existingIndex = globalState.items.findIndex(
      (item) => String(item.product.id) === String(product.id),
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
        items: [...globalState.items, { product, quantity }],
      }
    }
    notify()
  },

  removeItem(productId: string | number) {
    globalState = {
      ...globalState,
      items: globalState.items.filter(
        (item) => String(item.product.id) !== String(productId),
      ),
    }
    notify()
  },

  updateQuantity(productId: string | number, quantity: number) {
    if (quantity <= 0) {
      cartStore.removeItem(productId)
      return
    }
    globalState = {
      ...globalState,
      items: globalState.items.map((item) =>
        String(item.product.id) === String(productId)
          ? { ...item, quantity }
          : item,
      ),
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
  const [state, setState] = useState<CartState>(() => cartStore.getState())

  useEffect(() => {
    return cartStore.subscribe((newState) => {
      setState(newState)
    })
  }, [])

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.product.price_toman * item.quantity,
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
