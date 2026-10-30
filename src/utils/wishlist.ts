import { apiService } from '../services/api'

const WISHLIST_LOCAL_KEY = 'anahix_wishlist_local'

export interface WishlistItem {
  target_type: 'article' | 'guide'
  target_id: string
  title: string
  image_url?: string
  price_toman?: number
  created_at?: string
}

export function getLocalWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_LOCAL_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Exclude products - favorites are exclusively reserved for blog articles and tutorial guides
        return parsed.filter(
          (it) =>
            it && (it.target_type === 'article' || it.target_type === 'guide'),
        )
      }
    }
  } catch {}
  return []
}

export function isItemFavorited(
  targetType: 'article' | 'guide',
  targetId: string,
): boolean {
  const list = getLocalWishlist()
  return list.some(
    (it) => it.target_type === targetType && it.target_id === targetId,
  )
}

export async function toggleItemFavorite(
  item: WishlistItem,
  isLoggedIn = false,
): Promise<{ is_favorite: boolean; message: string }> {
  const current = getLocalWishlist()
  const exists = current.some(
    (it) =>
      it.target_type === item.target_type && it.target_id === item.target_id,
  )
  let next: WishlistItem[]
  let isFav = false

  if (exists) {
    next = current.filter(
      (it) =>
        !(
          it.target_type === item.target_type && it.target_id === item.target_id
        ),
    )
    isFav = false
  } else {
    next = [{ ...item, created_at: new Date().toISOString() }, ...current]
    isFav = true
  }

  try {
    localStorage.setItem(WISHLIST_LOCAL_KEY, JSON.stringify(next))
    window.dispatchEvent(
      new CustomEvent('anahix:wishlist:updated', {
        detail: { item, is_favorite: isFav },
      }),
    )
  } catch {}

  if (isLoggedIn) {
    try {
      await apiService.toggleFavorite({
        target_type: item.target_type,
        target_id: item.target_id,
        title: item.title,
      })
    } catch {}
  }

  return {
    is_favorite: isFav,
    message: isFav ? 'به علاقه‌مندی‌ها اضافه شد' : 'از علاقه‌مندی‌ها حذف شد',
  }
}
