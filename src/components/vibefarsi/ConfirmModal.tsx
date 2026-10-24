import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import type React from 'react'
import { createPortal } from 'react-dom'
import { ModalCloseButton } from './ModalCloseButton'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
  icon?: React.ReactNode
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'بله، حذف شود',
  cancelText = 'انصراف',
  variant = 'danger',
  loading = false,
  icon,
}) => {
  if (!isOpen) return null

  const isDanger = variant === 'danger'
  const descText = description || message || ''

  return createPortal(
    <div
      className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483647,
      }}
      dir="rtl"
    >
      <div className="min-h-full w-full flex items-center justify-center">
        <div className="relative w-full max-w-md my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-5 text-right">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-control flex items-center justify-center border shadow-xs ${
                  isDanger
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                }`}
              >
                {icon ||
                  (isDanger ? (
                    <Trash2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  ))}
              </div>
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {title}
              </h3>
            </div>
            <ModalCloseButton onClick={onClose} size="sm" />
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {descText}
          </p>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border/60">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="h-9 px-4 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`h-9 px-4 rounded-control font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-primary hover:bg-primary-hover text-primary-foreground'
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
