import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShoppingCart,
  X,
} from 'lucide-react'
import type React from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'cart'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message?: string
  image?: string
  duration?: number
}

interface NotificationContextType {
  notifications: NotificationItem[]
  showNotification: (item: Omit<NotificationItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  cartAdded: (title: string, message?: string, image?: string) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const showNotification = useCallback((item: Omit<NotificationItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newItem: NotificationItem = {
      ...item,
      id,
      duration: item.duration || 4000,
    }
    setNotifications((prev) => [newItem, ...prev.slice(0, 4)]) // Keep max 5 visible
  }, [])

  const success = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'success', title, message })
    },
    [showNotification],
  )

  const error = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'error', title, message })
    },
    [showNotification],
  )

  const info = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'info', title, message })
    },
    [showNotification],
  )

  const warning = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: 'warning', title, message })
    },
    [showNotification],
  )

  const cartAdded = useCallback(
    (title: string, message?: string, image?: string) => {
      showNotification({
        type: 'cart',
        title,
        message: message || 'با موفقیت به سبد خرید اضافه شد',
        image,
      })
    },
    [showNotification],
  )

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        success,
        error,
        info,
        warning,
        cartAdded,
        removeNotification,
      }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    )
  }
  return context
}

const NotificationContainer: React.FC<{
  notifications: NotificationItem[]
  onRemove: (id: string) => void
}> = ({ notifications, onRemove }) => {
  return (
    <div
      dir="rtl"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    >
      {notifications.map((item) => (
        <ToastItem
          key={item.id}
          item={item}
          onDismiss={() => onRemove(item.id)}
        />
      ))}
    </div>
  )
}

const ToastItem: React.FC<{
  item: NotificationItem
  onDismiss: () => void
}> = ({ item, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, item.duration || 4000)
    return () => clearTimeout(timer)
  }, [item.duration, onDismiss])

  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
      case 'cart':
        return <ShoppingCart className="h-5 w-5 text-blue-500 shrink-0" />
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0" />
    }
  }

  const getBorderColor = () => {
    switch (item.type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10'
      case 'error':
        return 'border-rose-500/30 bg-rose-500/10'
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10'
      case 'cart':
        return 'border-blue-500/30 bg-blue-500/10'
      default:
        return 'border-blue-500/30 bg-blue-500/10'
    }
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-xl transition-all duration-200 animate-fade-in-up bg-zinc-950/95 text-zinc-100 ${getBorderColor()}`}
      style={{
        boxShadow: 'var(--depth-surface)',
      }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
        />
      ) : (
        <div className="p-1 rounded-xl bg-background/80 shadow-sm">
          {getIcon()}
        </div>
      )}

      <div className="flex-1 space-y-0.5 text-right">
        <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
          {item.title}
        </h4>
        {item.message && (
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
            {item.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
