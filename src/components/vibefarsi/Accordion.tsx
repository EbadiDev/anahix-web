import { ChevronDown } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'

export interface AccordionItem {
  id: string
  title: string
  content: string | React.ReactNode
  icon?: React.ReactNode
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpenId?: string
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpenId,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<string[]>(() =>
    defaultOpenId ? [defaultOpenId] : [],
  )

  const toggleItem = (id: string) => {
    if (allowMultiple) {
      setOpenIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
      )
    } else {
      setOpenIds((prev) => (prev.includes(id) ? [] : [id]))
    }
  }

  return (
    <div dir="rtl" className={`space-y-2.5 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)
        return (
          <div
            key={`accordion-item-${item.id}`}
            className={`rounded-control border duration-motion ease-motion transition-all overflow-hidden shadow-surface ${
              isOpen
                ? 'border-border bg-card shadow-control'
                : 'border-border/60 bg-card/80 hover:bg-card hover:border-border'
            }`}
          >
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-right font-bold text-xs sm:text-sm text-foreground transition-colors cursor-pointer select-none"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-2.5">
                {item.icon && (
                  <span className="text-brand shrink-0">{item.icon}</span>
                )}
                <span>{item.title}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-motion ease-motion ${
                  isOpen ? 'rotate-180 text-foreground' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-2 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-card/50 animate-in fade-in slide-in-from-top-1 duration-motion ease-motion">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
