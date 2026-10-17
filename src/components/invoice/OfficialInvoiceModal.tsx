import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Printer,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { OfficialInvoice } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface OfficialInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  orderIdOrNo: string
  accessToken?: string
  isAdmin?: boolean
}

export const OfficialInvoiceModal: React.FC<OfficialInvoiceModalProps> = ({
  isOpen,
  onClose,
  orderIdOrNo,
  accessToken,
  isAdmin = false,
}) => {
  const [invoice, setInvoice] = useState<OfficialInvoice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedInvoiceNo, setCopiedInvoiceNo] = useState(false)
  const [copiedOrderNo, setCopiedOrderNo] = useState(false)
  const [copiedShaparak, setCopiedShaparak] = useState(false)

  const printAreaRef = useRef<HTMLDivElement>(null)

  const loadInvoice = async () => {
    if (!orderIdOrNo) return
    setLoading(true)
    setError('')
    try {
      let data: OfficialInvoice
      if (isAdmin) {
        data = await apiService.getAdminOrderInvoice(orderIdOrNo)
      } else {
        data = await apiService.getOrderInvoice(orderIdOrNo, accessToken)
      }
      setInvoice(data)
      setError('')
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات فاکتور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && orderIdOrNo) {
      setError('')
      loadInvoice()
    } else if (!isOpen) {
      setError('')
    }
  }, [isOpen, orderIdOrNo, accessToken, isAdmin])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleCopy = (text: string, type: 'invoice' | 'order' | 'shaparak') => {
    navigator.clipboard.writeText(text)
    if (type === 'invoice') {
      setCopiedInvoiceNo(true)
      setTimeout(() => setCopiedInvoiceNo(false), 2000)
    } else if (type === 'order') {
      setCopiedOrderNo(true)
      setTimeout(() => setCopiedOrderNo(false), 2000)
    } else if (type === 'shaparak') {
      setCopiedShaparak(true)
      setTimeout(() => setCopiedShaparak(false), 2000)
    }
  }

  const isPaid =
    invoice?.payment_status === 'completed' ||
    invoice?.payment_status === 'paid' ||
    invoice?.invoice_type === 'official'

  return createPortal(
    <div
      id="invoice-modal-portal"
      className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto animate-in fade-in"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="w-full max-w-2xl my-4 flex flex-col gap-3">
        {/* Action Bar (Hidden during print) - Graphite Technical Minimal */}
        <div className="flex items-center justify-between gap-3 bg-card border border-border/80 rounded-surface p-4 shadow-surface text-foreground print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-control bg-secondary border border-border/60 text-secondary-foreground flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                {isPaid ? 'رسید و صورتحساب خرید' : 'پیش‌فاکتور سفارش'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                فروشگاه هوش مصنوعی آناهیکس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 text-xs rounded-control px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-black shadow-control gap-1.5 flex items-center duration-motion ease-motion active:scale-[0.98] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ / ذخیره PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-control flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && !invoice && (
          <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-surface">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground font-medium">
              در حال بارگذاری صورتحساب...
            </p>
          </div>
        )}

        {/* Error State - ONLY shown if invoice is not loaded */}
        {error && !invoice && (
          <div className="bg-card border border-destructive/30 rounded-2xl p-6 text-center shadow-surface">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h4 className="text-sm font-black text-foreground">
              خطا در دریافت فاکتور
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
            <Button
              size="sm"
              onClick={loadInvoice}
              className="mt-4 h-8 text-xs rounded-xl"
            >
              تلاش مجدد
            </Button>
          </div>
        )}

        {/* Friendly Clean Invoice Card (Printable) */}
        {invoice && !loading && (
          <div
            ref={printAreaRef}
            className="printable-invoice bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none space-y-6"
            style={{ direction: 'rtl' }}
          >
            {/* Header: Store Name, Order Number, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md print:border print:border-blue-600 print:shadow-none">
                  A
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      فروشگاه هوش مصنوعی آناهیکس
                    </h2>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      anahix.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {isPaid ? 'صورتحساب و رسید خرید' : 'پیش‌فاکتور سفارش'}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                <Badge
                  variant="outline"
                  className={
                    isPaid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 text-xs px-3 py-1 font-bold'
                      : 'bg-amber-50 text-amber-700 border-amber-300 text-xs px-3 py-1 font-bold'
                  }
                >
                  {isPaid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-emerald-600 inline" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 ml-1 text-amber-600 inline" />
                  )}
                  {isPaid ? 'پرداخت موفق و تایید شده' : 'در انتظار پرداخت'}
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">
                  {invoice.issue_date_jalali}
                </span>
              </div>
            </div>

            {/* Quick Order & Customer Meta Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Order Info */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  اطلاعات سفارش
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">
                    شماره سفارش:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">
                      {invoice.order_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(invoice.order_number, 'order')}
                      className="text-slate-400 hover:text-slate-600 print:hidden"
                      title="کپی شماره سفارش"
                    >
                      {copiedOrderNo ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">
                    شماره فاکتور:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-800">
                      {invoice.invoice_number}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(invoice.invoice_number, 'invoice')
                      }
                      className="text-slate-400 hover:text-slate-600 print:hidden"
                      title="کپی شماره فاکتور"
                    >
                      {copiedInvoiceNo ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">زمان ثبت:</span>
                  <span className="text-slate-800 font-medium">
                    {invoice.issue_date_jalali}
                  </span>
                </div>
              </div>

              {/* Customer Info (Privacy Safe - Never shows account credentials or upgrade passwords) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  اطلاعات تحویل‌گیرنده
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">
                    نام خریدار:
                  </span>
                  <span className="font-bold text-slate-900">
                    {invoice.buyer.full_name &&
                    invoice.buyer.full_name !== 'خریدار محترم'
                      ? invoice.buyer.full_name
                      : 'کاربر آناهیکس'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">
                    شماره همراه:
                  </span>
                  <span
                    className="font-mono font-semibold text-slate-800"
                    dir="ltr"
                  >
                    {invoice.buyer.phone || 'ثبت نشده'}
                  </span>
                </div>

                {invoice.buyer.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">
                      ایمیل ارتباطی:
                    </span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {invoice.buyer.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                اقلام خریداری شده
              </span>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">شرح سفارش و اشتراک</th>
                      <th className="p-3 text-center w-16">تعداد</th>
                      <th className="p-3 text-left">قیمت واحد</th>
                      <th className="p-3 text-left">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoice.items.map((item, idx) => (
                      <tr
                        key={item.row_index || idx}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="p-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">
                            {item.product_title}
                          </span>
                          <span className="text-[11px] text-blue-600 font-medium">
                            {item.delivery_type}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-left font-mono text-slate-700">
                          {item.unit_price_toman.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-slate-900">
                          {item.subtotal_toman.toLocaleString('fa-IR')} تومان
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Payment Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>جمع کل اقلام:</span>
                <span className="font-mono font-semibold">
                  {invoice.subtotal_toman.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              {invoice.total_discount_toman > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                  <span>تخفیف اعمال شده:</span>
                  <span className="font-mono">
                    - {invoice.total_discount_toman.toLocaleString('fa-IR')}{' '}
                    تومان
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>مبلغ نهایی پرداختی:</span>
                <div className="text-left">
                  <span className="font-mono text-base text-blue-700 font-black">
                    {invoice.subtotal_toman - invoice.total_discount_toman > 0
                      ? (
                          invoice.subtotal_toman - invoice.total_discount_toman
                        ).toLocaleString('fa-IR')
                      : '۰'}{' '}
                    تومان
                  </span>
                </div>
              </div>

              {/* Payment Tracking Details */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>روش پرداخت:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.payment_method_fa}
                  </span>
                </div>

                {invoice.payment_ref_id && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>کد پیگیری شاپرک / تراکنش:</span>
                    <span className="font-mono font-bold text-blue-700 flex items-center gap-1">
                      {invoice.payment_ref_id}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(invoice.payment_ref_id || '', 'shaparak')
                        }
                        className="text-slate-400 hover:text-slate-600 print:hidden"
                        title="کپی کد رهگیری"
                      >
                        {copiedShaparak ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Friendly Warm Footer */}
            <div className="text-center pt-2 space-y-1">
              <p className="text-xs font-semibold text-slate-700">
                از خرید و اعتماد شما به آناهیکس صمیمانه متشکریم!
              </p>
              <p className="text-[11px] text-slate-400">
                در صورت بروز هرگونه سوال یا نیاز به پشتیبانی، تیم ما ۲۴ ساعته در
                کنار شماست. | anahix.com
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Robust A4 Print Stylesheet (Eliminates Blank 1st Page & Truncation) */}
      <style>{`
        @media print {
          /* Hide all application DOM outside of the invoice modal portal */
          body > *:not(#invoice-modal-portal) {
            display: none !important;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
          }

          #invoice-modal-portal {
            position: static !important;
            inset: auto !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .print\\:hidden, .print-hidden {
            display: none !important;
          }

          .printable-invoice {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            page-break-after: auto;
            page-break-before: auto;
            page-break-inside: auto;
          }

          /* Force high-fidelity color reproduction for badges and tables */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
