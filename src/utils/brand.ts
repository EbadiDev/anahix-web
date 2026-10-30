export function getSiteBrandName(fallback = ''): string {
  try {
    const saved = localStorage.getItem('site_name_fa')
    if (saved !== null) {
      return saved.trim()
    }
  } catch {}
  return fallback
}

/**
 * Normalizes media and asset URLs:
 * - fixes accidental `.oads/` or missing leading slash `uploads/`
 * - strips accidental trailing slashes on image files (e.g. `.jpg/` -> `.jpg`)
 * - ensures clean absolute paths for local server assets
 */
export function cleanMediaUrl(raw?: string): string {
  if (!raw) return ''
  let url = raw.trim()
  if (url.startsWith('.oads/')) {
    url = `/uploads/${url.slice(6)}`
  } else if (url.startsWith('oads/')) {
    url = `/uploads/${url.slice(5)}`
  } else if (url.startsWith('uploads/')) {
    url = `/${url}`
  }
  // Strip trailing slashes after file extensions like .jpg/ .png/
  url = url.replace(/\.(png|jpe?g|webp|svg|gif|ico)\/+$/i, '.$1')
  if (url.length > 1 && url.endsWith('/')) {
    url = url.slice(0, -1)
  }
  // Ensure leading slash for relative assets
  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    !url.startsWith('data:') &&
    !url.startsWith('/')
  ) {
    url = `/${url}`
  }
  return url
}
