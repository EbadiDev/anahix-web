import {
  Bot,
  Brain,
  Code2,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'

interface QuickServiceItem {
  id: string
  title: string
  badge?: string
  description: string
  icon: React.ReactNode
  gradient: string
  link: string
  isExternal?: boolean
}

interface QuickServicesGridProps {
  onSelectCategory?: (category: string) => void
}

export const QuickServicesGrid: React.FC<QuickServicesGridProps> = ({
  onSelectCategory,
}) => {
  const services: QuickServiceItem[] = [
    {
      id: 'chatgpt',
      title: 'اکانت ChatGPT Plus',
      badge: 'مدل GPT-4o',
      description: 'دسترسی نامحدود، پردازش تصویر و حافظه ابری',
      icon: <Brain className="h-6 w-6 text-emerald-400" />,
      gradient:
        'from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30',
      link: '/products/chatgpt-plus',
    },
    {
      id: 'claude',
      title: 'کلود Claude Pro Sonnet',
      badge: 'نسخه ۳.۷',
      description: 'بهترین برای نویسندگی، تحلیل متون و پردازش منطق',
      icon: <Bot className="h-6 w-6 text-amber-400" />,
      gradient:
        'from-amber-500/20 via-orange-500/10 to-transparent border-amber-500/30',
      link: '/products/claude-pro',
    },
    {
      id: 'gemini',
      title: 'جمینای ۱۸ ماهه قانونی',
      badge: 'به‌صرفه‌ترین',
      description: '۲ ترابایت فضای ابری گوگل وان همراه هوش مصنوعی',
      icon: <Sparkles className="h-6 w-6 text-blue-400" />,
      gradient:
        'from-blue-500/20 via-indigo-500/10 to-transparent border-blue-500/30',
      link: '/products/gemini-advanced-18m',
    },
    {
      id: 'coding',
      title: 'دستیار کدنویسی Cursor AI',
      badge: 'ویژه دولوپرها',
      description: 'توسعه فوق سریع نرم‌افزار با قابلیت کامل IDE',
      icon: <Code2 className="h-6 w-6 text-purple-400" />,
      gradient:
        'from-purple-500/20 via-fuchsia-500/10 to-transparent border-purple-500/30',
      link: '/?category=coding_ai',
    },
    {
      id: 'virtual_numbers',
      title: 'شماره مجازی بین‌المللی',
      badge: '۱۸۰ کشور',
      description: 'دریافت آنی پیامک تلگرام، اوپن‌ای‌آی و گوگل',
      icon: <Radio className="h-6 w-6 text-cyan-400" />,
      gradient:
        'from-cyan-500/20 via-sky-500/10 to-transparent border-cyan-500/30',
      link: '/virtual-numbers',
    },
    {
      id: 'storage',
      title: 'ارتقای فضای Google One',
      badge: 'حجم بالا',
      description: 'افزایش فضای جیمیل و درایو اختصاصی به صورت رسمی',
      icon: <HardDrive className="h-6 w-6 text-rose-400" />,
      gradient:
        'from-rose-500/20 via-pink-500/10 to-transparent border-rose-500/30',
      link: '/?category=cloud_storage',
    },
  ]

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>دسترسی سریع به سرویس‌های پرمخاطب</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            انتخاب پرکاربردترین لایسنس‌ها با ضمانت فعال‌سازی آنی
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {services.map((item) => (
          <Link
            key={item.id}
            to={item.link}
            onClick={() => {
              if (item.link.includes('category=') && onSelectCategory) {
                const cat = item.link.split('category=')[1]
                onSelectCategory(cat)
              }
            }}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 bg-gradient-to-b backdrop-blur-md transition-all duration-200 hover:-translate-y-1 ${item.gradient}`}
            style={{
              boxShadow: 'var(--depth-surface)',
            }}
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-xl bg-card border border-border shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                {item.badge && (
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>ورود به پلن</span>
              <span className="mr-1 group-hover:-translate-x-1 transition-transform">
                ←
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
