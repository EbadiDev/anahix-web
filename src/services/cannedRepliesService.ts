export interface CannedReply {
  id: string
  title: string
  text: string
  shortcut?: string
  updated_at: string
}

const STORAGE_KEY = 'anahix_admin_canned_replies'

export const DEFAULT_CANNED_REPLIES: CannedReply[] = [
  {
    id: 'canned-1',
    title: 'تایید فعال‌سازی لایسنس',
    text: 'کد لایسنس بررسی شد و مجددا فعال گردید. لطفاً مجدداً لاگین فرمایید.',
    shortcut: '/license',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'canned-2',
    title: 'راهنمای پاکسازی کش و پنجره ناشناس',
    text: 'لطفاً کش مرورگر را پاک نموده یا در پنجره ناشناس (Incognito) اقدام به لاگین نمایید.',
    shortcut: '/cache',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'canned-3',
    title: 'پایان زمان شماره مجازی و عودت وجه',
    text: 'زمان شماره مجازی به پایان رسیده بود و هزینه آن به طور کامل به موجودی کیف پول شما برگشت داده شد.',
    shortcut: '/5sim-refund',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'canned-4',
    title: 'درخواست اسکرین‌شات خطا',
    text: 'لطفاً اسکرین‌شات از خطای ظاهر شده در صفحه را برای بررسی فنی ارسال فرمایید.',
    shortcut: '/screenshot',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'canned-5',
    title: 'ارجاع به کارشناس ارشد فنی',
    text: 'درخواست شما به کارشناس فنی ارجاع شد و تا دقایقی دیگر فعال‌سازی نهایی خواهد شد.',
    shortcut: '/expert',
    updated_at: new Date().toISOString(),
  },
]

export const cannedRepliesService = {
  getAll(): CannedReply[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(DEFAULT_CANNED_REPLIES),
        )
        return DEFAULT_CANNED_REPLIES
      }
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
      return DEFAULT_CANNED_REPLIES
    } catch {
      return DEFAULT_CANNED_REPLIES
    }
  },

  save(
    item: { title: string; text: string; shortcut?: string },
    id?: string,
  ): CannedReply {
    const list = this.getAll()
    const now = new Date().toISOString()

    if (id) {
      const idx = list.findIndex((c) => c.id === id)
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          title: item.title.trim(),
          text: item.text.trim(),
          shortcut: item.shortcut?.trim() || undefined,
          updated_at: now,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
        window.dispatchEvent(new CustomEvent('anahix:canned-replies-updated'))
        return list[idx]
      }
    }

    const newItem: CannedReply = {
      id: `canned-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title.trim(),
      text: item.text.trim(),
      shortcut: item.shortcut?.trim() || undefined,
      updated_at: now,
    }

    list.unshift(newItem)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('anahix:canned-replies-updated'))
    return newItem
  },

  delete(id: string): void {
    const list = this.getAll().filter((c) => c.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('anahix:canned-replies-updated'))
  },

  reset(): CannedReply[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CANNED_REPLIES))
    window.dispatchEvent(new CustomEvent('anahix:canned-replies-updated'))
    return DEFAULT_CANNED_REPLIES
  },
}
