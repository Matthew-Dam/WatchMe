import { useState, type ReactNode } from 'react'
import { EyeOff, Eye } from 'lucide-react'

interface SpoilerShieldProps {
  isVisible: boolean
  children: ReactNode
}

export function SpoilerShield({ isVisible, children }: SpoilerShieldProps) {
  const [revealed, setRevealed] = useState(false)
  const show = isVisible || revealed

  if (show) {
    return (
      <div className="relative">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-heading uppercase tracking-wider bg-lime/10 text-lime border border-lime/20 mb-1">
          spoiler
        </span>
        {children}
      </div>
    )
  }

  return (
    <div
      className="relative cursor-pointer select-none group"
      onClick={() => setRevealed(true)}
    >
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-gray-300 transition-colors">
          <EyeOff size={18} />
          <span className="text-[10px] font-heading uppercase tracking-wider">
            Spoiler - tap to reveal
          </span>
        </div>
      </div>
      <div className="blur-sm pointer-events-none select-none opacity-30">
        {children}
      </div>
    </div>
  )
}

export function SpoilerBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-heading uppercase tracking-wider bg-lime/10 text-lime border border-lime/20">
      <Eye size={10} />
      spoiler
    </span>
  )
}
