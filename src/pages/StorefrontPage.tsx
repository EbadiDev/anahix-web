import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Headphones,
  HelpCircle,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandIcons } from '../components/BrandIcons'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { Input } from '../components/ui/input'
import { useCart } from '../lib/cartStore'
import { apiService } from '../services/api'
import type { CustomerProfile, Order, PaymentGateway, Product } from '../types'

interface StorefrontPageProps {
  orders: Order[]
  onOrderCreated: (order: Order) => void
  setBalance?: React.Dispatch<React.SetStateAction<number>>
}

export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  orders,
  onOrderCreated,
  setBalance,
}) => {
  const navigate = useNavigate()
  const cart = useCart()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [prods, pays, cust] = await Promise.all([
        apiService.getProducts(),
        apiService.getPayments(),
        apiService.getCustomerProfile(),
      ])
      setProducts(prods)
      setPayments(pays)
      if (cust) setCustomer(cust)
      setLoading(false)
    }
    init()
  }, [])

  const handleCartCheckoutSubmit = async (data: {
    items: { product_id: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    account_email?: string
    account_password?: string
    customer_notes?: string
    coupon_code?: string
  }) => {
    const newOrder = await apiService.createOrder({
      items: data.items,
      payment_platform: data.payment_platform,
      customer_phone: data.customer_phone,
      account_email: data.account_email,
      account_password: data.account_password,
      customer_notes: data.customer_notes,
      coupon_code: cart.coupon?.code || data.coupon_code,
    })

    cart.clearCart()
    setIsCartOpen(false)

    if (data.payment_platform === 'balance') {
      if (setBalance) {
        setBalance((prev) => Math.max(0, prev - newOrder.amount_toman))
      }
      if (customer) {
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                balance_toman: Math.max(
                  0,
                  prev.balance_toman - newOrder.amount_toman,
                ),
              }
            : null,
        )
      }
    }

    onOrderCreated(newOrder)
    navigate(`/track?order_no=${encodeURIComponent(newOrder.order_no)}`)
  }

  const categories = [
    { id: 'all', label: 'همه سرویس‌ها' },
    { id: 'ai_chat', label: 'هوش مصنوعی و چت‌بات' },
    { id: 'coding_ai', label: 'دستیار کدنویسی' },
    { id: 'personal_upgrade', label: 'ارتقای اکانت شخصی' },
    { id: 'cloud_storage', label: 'فضای ابری و گوگل وان' },
  ]

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      p.title_fa.toLowerCase().includes(query) ||
      p.title_en.toLowerCase().includes(query) ||
      p.description_fa.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  const faqs = [
    {
      q: 'آیا اشتراک‌ها قانونی پرداخت می‌شوند و قطعی نخواهند داشت؟',
      a: 'بله، تمامی اشتراک‌های آناهیکس به صورت ۱۰۰٪ قانونی توسط کارت‌های اعتباری بین‌المللی اختصاصی و بدون استفاده از روش‌های پرخطر یا اشتراکی هکی پرداخت می‌شوند. در طول دوره اشتراک ضمانت کامل و عدم قطعی ارائه می‌گردد.',
    },
    {
      q: 'تفاوت تحویل لینک فوری و ارتقای اکانت شخصی چیست؟',
      a: 'در حالت «لینک فوری»، بلافاصله پس از پرداخت لینک دعوت فمیلی اختصاصی برای شما صادر شده و درجا روی جیمیل شما فعال می‌شود. در حالت «ارتقای اکانت شخصی»، اپراتور متخصص آناهیکس با ورود امن و تبادل لایو کد ۲FA اشتراک را مستقیم روی اکانت خودتان تمدید می‌کند.',
    },
    {
      q: 'سیاست امنیتی Zeroize رمزهای عبور چگونه کار می‌کند؟',
      a: 'در سیستم آناهیکس، اطلاعات حساس و کلمه عبور وارد شده توسط الگوریتم رمزنگاری نامتقارن محافظت شده و بلافاصله پس از تکمیل فرآیند فعال‌سازی توسط اپراتور، رمز عبور به طور برگشت‌ناپذیر از پایگاه داده سرور پاکسازی (Zeroize) می‌شود.',
    },
    {
      q: 'در صورت بروز مشکل در فرآیند فعال‌سازی چه باید کرد؟',
      a: 'پشتیبانی ۲۴ ساعته تلگرام آناهیکس (@AnahixSupport) آماده پاسخگویی سریع است. همچنین می‌توانید با شماره سفارش خود وضعیت را در تب «پیگیری سفارش» لحظه‌ای رصد نمایید.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm">
          <div className="relative z-10 max-w-2xl space-y-4 text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Zap className="h-3.5 w-3.5" />
              <span>تحویل ۰ ثانیه‌ای لایسنس و اکانت‌های هوش مصنوعی</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              خرید اشتراک قانونی{' '}
              <span className="text-blue-600 dark:text-blue-400">
                ChatGPT Plus، Claude و Gemini
              </span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              دسترسی مستقیم و پایدار کاربران ایرانی به پیشرفته‌ترین مدل‌های هوش
              مصنوعی روز جهان بدون ریسک مسدودی و با پرداخت ریالی آنی.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>ضمانت کامل بازگشت وجه</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-blue-600" />
                <span>پروتکل امنیت کلمه عبور (Zeroize)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>پرداخت عضو شتاب و تتر</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="text-[11px] font-bold text-muted-foreground mb-3">
              پشتیبانی از برترین سرویس‌های جهان:
            </div>
            <BrandIcons />
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Input
                type="text"
                placeholder="جستجوی سرویس (مثلاً Gemini، ChatGPT)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-xs rounded-xl bg-card border-border"
              />
              <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section>
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">
                در حال بارگذاری اشتراک‌ها و موجودی لایسنس‌ها...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground space-y-2">
              <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <div className="font-bold text-sm text-foreground">
                محصولی با این مشخصات یافت نشد
              </div>
              <p className="text-xs">
                لطفاً کلمه کلیدی دیگری را جستجو کنید یا دسته‌بندی را به «همه
                سرویس‌ها» تغییر دهید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => setIsCartOpen(true)}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4-Pillar Reassurance Trust Grid */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-foreground">
              چرا آناهیکس را برای خرید اکانت‌های هوش مصنوعی انتخاب می‌کنند؟
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              استانداردهای شفاف امنیتی و فنی منطبق با ساختار پرداختی بین‌المللی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                تحویل آنی و بدون معطلی
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                لینک‌های اختصاصی و اکانت‌های پیش‌ساخته بلافاصله پس از پرداخت در
                همان لحظه صادر و تحویل می‌گردند.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                تضمین عدم مسدودی و اصالت
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                پرداخت‌ها با مسترکارت معتبر و قانونی انجام شده و در طول دوره به
                هیچ عنوان غیرفعال نمی‌شوند.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                سیاست نابودسازی رمز (Zeroize)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                کلمه عبور ارائه شده در ارتقای شخصی پس از اتمام سفارش فوراً از
                دیتابیس امحا شده و غیرقابل بازیابی است.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-black">
                <Headphones className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-foreground">
                پشتیبانی ۲۴ ساعته متخصص
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                کارشناسان فنی مسلط به پلتفرم‌های هوش مصنوعی در کلیه روزهای هفته
                پاسخگوی سوالات شما هستند.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-black text-foreground">
              پرسش‌های متداول خریداران
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              پاسخ به سوالات متداول درباره نحوه پرداخت، فعال‌سازی و پشتیبانی
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border bg-muted/20 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-right font-bold text-xs sm:text-sm text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 bg-background/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 mt-12 py-8 text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  A
                </div>
                <span className="font-bold text-foreground">
                  آناهیکس (ANAHIX)
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                سامانه هوشمند ارائه قانونی اشتراک‌های بین‌المللی، لایسنس‌های هوش
                مصنوعی و شماره‌های مجازی بین‌المللی در ایران با زیرساخت پرداخت
                امن.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                دسترسی سریع
              </h5>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <Link to="/" className="hover:text-blue-600">
                    لیست اشتراک‌ها
                  </Link>
                </li>
                <li>
                  <Link to="/virtual-numbers" className="hover:text-blue-600">
                    شماره مجازی (SMS Verification)
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-blue-600">
                    پیگیری سفارش و فاکتورها
                  </Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="hover:text-blue-600">
                    ورود به پنل مدیریت
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                سرویس‌های محبوب
              </h5>
              <ul className="space-y-2 text-[11px]">
                <li>اشتراک قانونی ChatGPT Plus</li>
                <li>اکانت اختصاصی Claude Pro Sonnet</li>
                <li>لینک ۱۸ ماهه Google Gemini Advanced</li>
                <li>اکانت Cursor AI ویژه برنامه‌نویسان</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                پشتیبانی و ارتباط
              </h5>
              <p className="text-[11px] leading-relaxed">
                تیم پشتیبانی آناهیکس در کلیه روزهای هفته آماده پاسخگویی به
                سوالات و راهنمایی فعال‌سازی شماست.
              </p>
              <div className="mt-3">
                <a
                  href="https://t.me/AnahixSupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>پشتیبانی تلگرام: @AnahixSupport</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <div>
              © ۱۴۰۵ تمامی حقوق متعلق به سامانه آناهیکس (Anahix) می‌باشد.
            </div>
            <div className="text-muted-foreground/80 font-latin">
              Security Powered by AES-256-GCM Vault & Zero-Knowledge
              Architecture
            </div>
          </div>
        </div>
      </footer>

      {/* Unified Cart & Checkout Workbench */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        payments={payments}
        onSubmit={handleCartCheckoutSubmit}
      />
    </div>
  )
}
