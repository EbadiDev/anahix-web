import { LifeBuoy, MessageSquare, Plus, Send } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import type { Order, VirtualNumberOrder } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ProfileSupportTabProps {
  orders: Order[]
  virtualOrders: VirtualNumberOrder[]
}

interface TicketItem {
  id: string
  ticketNo: string
  subject: string
  department: string
  relatedOrderNo?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  statusLabel: string
  date: string
  messages: Array<{
    id: string
    sender: 'user' | 'support'
    text: string
    time: string
  }>
}

export const ProfileSupportTab: React.FC<ProfileSupportTabProps> = ({
  orders,
  virtualOrders,
}) => {
  const [tickets, setTickets] = useState<TicketItem[]>(() => {
    try {
      const stored = localStorage.getItem('anahix_customer_tickets')
      if (stored) return JSON.parse(stored)
    } catch (_e) {
      // ignore
    }
    return []
  })

  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null)
  const [newReplyText, setNewReplyText] = useState('')

  // New Ticket Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDepartment, setNewDepartment] = useState('شماره‌های مجازی (SMS)')
  const [relatedOrder, setRelatedOrder] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim()) return

    const newTicketObj: TicketItem = {
      id: `t-${Date.now()}`,
      ticketNo: String(Math.floor(10000 + Math.random() * 90000)),
      subject: newSubject,
      department: newDepartment,
      relatedOrderNo: relatedOrder || undefined,
      status: 'OPEN',
      statusLabel: 'در انتظار پاسخ پشتیبان',
      date: 'هم‌اکنون',
      messages: [
        {
          id: `m-${Date.now()}`,
          sender: 'user',
          text: newMessage,
          time: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ],
    }

    const updated = [newTicketObj, ...tickets]
    setTickets(updated)
    try {
      localStorage.setItem('anahix_customer_tickets', JSON.stringify(updated))
    } catch (_e) {
      // ignore
    }
    setIsNewModalOpen(false)
    setNewSubject('')
    setNewMessage('')
    setRelatedOrder('')
  }

  const handleSendReply = () => {
    if (!newReplyText.trim() || !activeTicket) return

    const updated = {
      ...activeTicket,
      messages: [
        ...activeTicket.messages,
        {
          id: `m-${Date.now()}`,
          sender: 'user' as const,
          text: newReplyText,
          time: new Date().toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ],
    }

    const updatedTickets = tickets.map((t) =>
      t.id === updated.id ? updated : t,
    )
    setTickets(updatedTickets)
    setActiveTicket(updated)
    setNewReplyText('')
    try {
      localStorage.setItem(
        'anahix_customer_tickets',
        JSON.stringify(updatedTickets),
      )
    } catch (_e) {
      // ignore
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              پشتیبانی آنلاین و تیکت‌ها (Support Center)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            پاسخگویی تضمینی در کمتر از ۱۵ دقیقه به همراه اتصال مستقیم به سفارش‌ها
          </p>
        </div>

        <Button
          onClick={() => setIsNewModalOpen(true)}
          className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          ارسال تیکت جدید
        </Button>
      </div>

      {/* 2. Tickets List */}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              هنوز تیکت پشتیبانی ثبت نکرده‌اید
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              در صورت وجود هرگونه ابهام، سوال یا مشکل پیرامون سفارش‌ها، تیکت جدید
              ارسال نمایید.
            </p>
            <Button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-4 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              ارسال تیکت جدید
            </Button>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isOpen = ticket.status === 'OPEN'
            const isResolved = ticket.status === 'RESOLVED'

            return (
              <div
                key={ticket.id}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {ticket.subject}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        #{ticket.ticketNo}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                      <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                        دپارتمان: {ticket.department}
                      </span>
                      {ticket.relatedOrderNo && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            سفارش مرتبط #{ticket.relatedOrderNo}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-sans">{ticket.date}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                  <Badge
                    variant="outline"
                    className={`text-xs px-2.5 py-0.5 ${
                      isResolved
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : isOpen
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                    }`}
                  >
                    {ticket.statusLabel}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTicket(ticket)}
                    className="h-8 text-xs rounded-xl px-3"
                  >
                    مشاهده گفتگو ({ticket.messages.length})
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 3. Ticket Conversation Thread Modal */}
      {activeTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeTicket.subject}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  تیکت #{activeTicket.ticketNo} • {activeTicket.department}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Conversation list */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/50 dark:bg-slate-950/50">
              {activeTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-start' : 'items-end'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75 font-mono">
                      <span>
                        {msg.sender === 'user' ? 'شما' : 'پشتیبانی آناهیکس'}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <Input
                type="text"
                placeholder="پاسخ خود را بنویسید..."
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="h-10 text-xs rounded-xl"
              />
              <Button
                onClick={handleSendReply}
                disabled={!newReplyText.trim()}
                className="h-10 px-4 rounded-xl bg-blue-600 text-white"
              >
                <Send className="w-4 h-4 ml-1" />
                ارسال
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Create New Ticket Modal with Order Linking */}
      {isNewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-blue-600" />
                ثبت تیکت پشتیبانی جدید
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  موضوع تیکت
                </label>
                <Input
                  type="text"
                  placeholder="مثال: مشکل در تایید شماره تلگرام"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    دپارتمان مربوطه
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="شماره‌های مجازی (SMS)">
                      شماره‌های مجازی (SMS)
                    </option>
                    <option value="اکانت‌های هوش مصنوعی">
                      اکانت‌های هوش مصنوعی
                    </option>
                    <option value="امور مالی و کیف پول">
                      امور مالی و کیف پول
                    </option>
                    <option value="سایر موارد">سایر موارد</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    اتصال به سفارش مرتبط (اختیاری)
                  </label>
                  <select
                    value={relatedOrder}
                    onChange={(e) => setRelatedOrder(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
                  >
                    <option value="">بدون سفارش مرتبط</option>
                    {orders.map((o) => (
                      <option key={o.order_no} value={o.order_no}>
                        #{o.order_no} - {o.product_title}
                      </option>
                    ))}
                    {virtualOrders.map((v) => (
                      <option key={v.order_no} value={v.order_no}>
                        #{v.order_no} - {v.service_name_fa} ({v.country_name_fa}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  متن پیام شما
                </label>
                <textarea
                  rows={4}
                  placeholder="لطفاً شرح مشکل یا سوال خود را با جزئیات بنویسید..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-9 text-xs rounded-xl"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="h-9 px-5 text-xs rounded-xl bg-blue-600 text-white font-semibold"
                >
                  ثبت و ارسال تیکت
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
