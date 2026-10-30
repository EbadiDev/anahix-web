import { Star } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { toPersianDigits } from '../../utils/formatters'

interface StarRatingProps {
  rating: number
  maxStars?: number
  interactive?: boolean
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  className?: string
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'md',
  showNumber = false,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const effectiveRating = hoverRating !== null ? hoverRating : rating

  return (
    <div
      dir="rtl"
      className={`inline-flex items-center gap-1 text-amber-400 select-none ${className}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const starVal = i + 1
          const isFilled = starVal <= effectiveRating
          const isHalf =
            !isFilled &&
            starVal - 0.5 <= effectiveRating &&
            hoverRating === null

          const starKey = `star-rating-item-${starVal}`

          return (
            <button
              key={starKey}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starVal)}
              onMouseEnter={() => interactive && setHoverRating(starVal)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-none'
                  : 'cursor-default'
              }`}
              title={`${toPersianDigits(starVal)} ستاره`}
              aria-label={`${toPersianDigits(starVal)} ستاره`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                      ? 'fill-amber-400/50 text-amber-400'
                      : 'text-zinc-600 dark:text-zinc-700'
                } transition-colors`}
              />
            </button>
          )
        })}
      </div>

      {showNumber && (
        <span className="text-xs font-bold text-zinc-300 font-latin mr-1">
          {toPersianDigits(rating.toFixed(1))}
        </span>
      )}
    </div>
  )
}
