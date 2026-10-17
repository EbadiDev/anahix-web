import { RotateCw } from 'lucide-react'
import type React from 'react'
import { useRef, useState } from 'react'

interface FlipCard3DProps {
  front: React.ReactNode
  back: React.ReactNode
  className?: string
  aspectRatio?: string
}

export const FlipCard3D: React.FC<FlipCard3DProps> = ({
  front,
  back,
  className = '',
  aspectRatio = 'aspect-[1.586/1]',
}) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Max tilt angle: 12 degrees
    const rotateY = ((x - centerX) / centerX) * 12
    const rotateX = -((y - centerY) / centerY) * 12

    setRotate({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  const toggleFlip = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFlipped((prev) => !prev)
  }

  return (
    <div className={`relative ${className}`} style={{ perspective: '1200px' }}>
      <div
        ref={cardRef}
        onClick={toggleFlip}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y + (isFlipped ? 180 : 0)}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 600ms cubic-bezier(0.2, 0, 0, 1)',
        }}
        className={`relative w-full ${aspectRatio} rounded-surface cursor-pointer select-none`}
      >
        {/* Front Face */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="absolute inset-0 w-full h-full rounded-surface overflow-hidden"
        >
          {front}

          {/* Flip Hint Button on Front */}
          <button
            type="button"
            onClick={toggleFlip}
            className="absolute bottom-3 left-3 p-1.5 rounded-control bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/20 text-[10px] flex items-center gap-1 transition-all duration-motion active:scale-[0.95] cursor-pointer z-20"
            title="چرخش کارت"
          >
            <RotateCw className="w-3 h-3" />
            <span>پشت کارت</span>
          </button>
        </div>

        {/* Back Face */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 w-full h-full rounded-surface overflow-hidden"
        >
          {back}

          {/* Flip Hint Button on Back */}
          <button
            type="button"
            onClick={toggleFlip}
            className="absolute bottom-3 right-3 p-1.5 rounded-control bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/20 text-[10px] flex items-center gap-1 transition-all duration-motion active:scale-[0.95] cursor-pointer z-20"
            title="چرخش به روی کارت"
          >
            <RotateCw className="w-3 h-3" />
            <span>روی کارت</span>
          </button>
        </div>
      </div>
    </div>
  )
}
