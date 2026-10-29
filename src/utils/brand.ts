export function getSiteBrandName(fallback = 'فروشگاه'): string {
  try {
    const saved = localStorage.getItem('site_name_fa')
    if (saved?.trim() && saved.trim() !== 'آناهیکس') {
      return saved.trim()
    }
  } catch {}
  return fallback
}
