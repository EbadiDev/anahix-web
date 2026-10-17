import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { apiService } from '../../services/api'
import { AuthModal } from '../AuthModal'
import { useNotification } from '../vibefarsi/NotificationContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation()
  const { warning } = useNotification()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const hasWarnedRef = useRef(false)
  const isLoggedIn = apiService.isCustomerLoggedIn()

  useEffect(() => {
    if (!isLoggedIn && !hasWarnedRef.current) {
      hasWarnedRef.current = true
      warning(
        'نیاز به ورود به حساب کاربری',
        'برای دسترسی به این بخش، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
    }
  }, [isLoggedIn, warning])

  if (!isLoggedIn) {
    return (
      <>
        <Navigate to="/" state={{ from: location }} replace />
        <AuthModal
          isOpen={isAuthOpen}
          initialMode="login"
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            setIsAuthOpen(false)
            window.location.reload()
          }}
        />
      </>
    )
  }

  return <>{children}</>
}
