import {
  Edit2,
  FileText,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  type CannedReply,
  cannedRepliesService,
} from '../../services/cannedRepliesService'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface AdminCannedRepliesViewProps {
  onSelectReply?: (replyText: string) => void
  isModalMode?: boolean
}

export const AdminCannedRepliesView: React.FC<AdminCannedRepliesViewProps> = ({
  onSelectReply,
  isModalMode = false,
}) => {
  const { success: notifySuccess } = useNotification()
  const [replies, setReplies] = useState<CannedReply[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Edit / Create modal state
  const [editingReply, setEditingReply] = useState<CannedReply | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formText, setFormText] = useState('')
  const [formShortcut, setFormShortcut] = useState('')

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    id: string | null
  }>({
    isOpen: false,
    id: null,
  })

  const loadReplies = () => {
    setReplies(cannedRepliesService.getAll())
  }

  useEffect(() => {
    loadReplies()
    const handler = () => loadReplies()
    window.addEventListener('anahix:canned-replies-updated', handler)
    return () =>
      window.removeEventListener('anahix:canned-replies-updated', handler)
  }, [])

  const handleOpenCreate = () => {
    setEditingReply(null)
    setFormTitle('')
    setFormText('')
    setFormShortcut('')
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (item: CannedReply) => {
    setEditingReply(item)
    setFormTitle(item.title)
    setFormText(item.text)
    setFormShortcut(item.shortcut || '')
    setIsEditorOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formText.trim()) return

    cannedRepliesService.save(
      {
        title: formTitle,
        text: formText,
        shortcut: formShortcut,
      },
      editingReply?.id,
    )

    notifySuccess(
      'پاسخ آماده',
      editingReply
        ? 'پاسخ آماده با موفقیت ویرایش شد.'
        : 'پاسخ آماده جدید ذخیره شد.',
    )
    setIsEditorOpen(false)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = () => {
    if (!deleteConfirm.id) return
    cannedRepliesService.delete(deleteConfirm.id)
    notifySuccess('حذف پاسخ', 'پاسخ آماده با موفقیت حذف گردید.')
    setDeleteConfirm({ isOpen: false, id: null })
  }

  const handleReset = () => {
    cannedRepliesService.reset()
    notifySuccess('بازیابی پیش‌فرض', 'قالب‌های پیش‌فرض پشتیبانی بازیابی شدند.')
  }

  const filteredReplies = replies.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      r.text.toLowerCase().includes(q) ||
      Boolean(r.shortcut?.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Action Bar */}
      {!isModalMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              مدیریت قالب‌ها و پاسخ‌های آماده (Canned Responses)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تعریف الگوهای استاندارد برای پاسخ‌دهی سریع اپراتورها در میز تیکت‌ها
              و گفتگوها
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="بازیابی قالب‌های پیش‌فرض"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>پیش‌فرض‌ها</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن پاسخ آماده جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="p-4 rounded-surface bg-card border border-border/80 shadow-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onSearch={(val) => val !== undefined && setSearchQuery(val)}
            placeholder="جستجو در عنوان یا متن پاسخ‌های آماده..."
            debounceMs={300}
          />
        </div>

        {isModalMode && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition flex items-center justify-center gap-1.5 shadow-control cursor-pointer shrink-0 duration-motion active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>پاسخ جدید</span>
          </button>
        )}
      </div>

      {/* List / Table of Canned Replies */}
      {filteredReplies.length === 0 ? (
        <div className="p-16 rounded-surface border border-dashed border-border/80 text-center bg-card space-y-3 shadow-surface">
          <div className="w-12 h-12 rounded-control bg-secondary text-brand flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            {searchQuery
              ? 'پاسخ آماده‌ای با این جستجو یافت نشد'
              : 'هنوز هیچ پاسخ آماده‌ای تعریف نشده است'}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            می‌توانید با زدن دکمه «افزودن پاسخ آماده جدید»، متن‌های تکراری و
            پرتکرار خود را ذخیره کنید تا با ۱ کلیک در چت ثبت شوند.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد اولین پاسخ آماده</span>
          </button>
        </div>
      ) : (
        <div className="rounded-surface border border-border/80 bg-card shadow-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60 select-none">
                <tr>
                  <th className="py-3.5 px-4 text-center">عنوان الگو</th>
                  <th className="py-3.5 px-4 text-center">میانبر</th>
                  <th className="py-3.5 px-4 text-right pr-6">
                    متن پاسخ آماده
                  </th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {filteredReplies.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-foreground text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.shortcut ? (
                        <span className="font-mono font-latin text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control">
                          {item.shortcut}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right pr-6 max-w-md">
                      <div
                        className="text-foreground leading-relaxed line-clamp-2"
                        title={item.text}
                      >
                        {item.text}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {onSelectReply && (
                          <button
                            type="button"
                            onClick={() => onSelectReply(item.text)}
                            className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-control transition cursor-pointer"
                          >
                            استفاده در چت
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 rounded-control border border-border/60 hover:bg-muted text-foreground flex items-center justify-center transition cursor-pointer shadow-xs"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 flex items-center justify-center transition cursor-pointer shadow-xs"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483648,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-center justify-center">
              <div className="w-full max-w-lg my-auto bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <h3 className="text-base font-black text-foreground">
                      {editingReply
                        ? 'ویرایش پاسخ آماده'
                        : 'افزودن پاسخ آماده جدید'}
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsEditorOpen(false)}
                    size="sm"
                  />
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      عنوان کوتاه پاسخ (جهت نمایش روی چیپ‌ها):
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="مثلاً: تایید فعال‌سازی، راهنمای کش و..."
                      required
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      کد میانبر اختیاری (مثلاً /license):
                    </label>
                    <input
                      type="text"
                      value={formShortcut}
                      onChange={(e) => setFormShortcut(e.target.value)}
                      placeholder="اختیاری..."
                      className="w-full h-10 px-3.5 rounded-field border border-border/60 bg-muted/20 text-xs font-mono font-latin text-foreground outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      متن کامل پاسخ ارسالی به خریدار:
                    </label>
                    <textarea
                      rows={4}
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      placeholder="متن کامل پاسخ پشتیبانی را بنویسید..."
                      required
                      className="w-full p-3 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-sans leading-relaxed resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control transition cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      {editingReply
                        ? 'ذخیره تغییرات پاسخ آماده'
                        : 'ثبت پاسخ آماده جدید'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="حذف پاسخ آماده"
        message="آیا از حذف این الگوی پاسخ آماده اطمینان دارید؟"
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        onConfirm={confirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  )
}
