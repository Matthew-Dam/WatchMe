import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TitleCard } from '@/components/common/TitleCard'
import type { Title } from '@/types'

interface TitleRowProps {
  title: string
  items: Title[]
  onPlay?: (title: Title) => void
}

export function TitleRow({ title, items, onPlay }: TitleRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollButtons)
    updateScrollButtons()
    return () => el.removeEventListener('scroll', updateScrollButtons)
  }, [updateScrollButtons])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.children[0]?.getBoundingClientRect().width ?? 176
    const gap = 16
    const scrollAmount = (cardWidth + gap) * 2
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const resizeObserver = new ResizeObserver(updateScrollButtons)
    resizeObserver.observe(el)
    return () => resizeObserver.disconnect()
  }, [updateScrollButtons])

  if (!items.length) return null

  return (
    <section className="relative">
      <h2 className="text-lg font-heading font-bold text-white mb-4">
        {title}
      </h2>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-r from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-surface-light/80 border border-border/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan/30 transition-colors">
              <ChevronLeft size={20} />
            </div>
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {items.map((item) => (
            <TitleCard key={item.id} title={item} onPlay={onPlay} />
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-l from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="w-9 h-9 rounded-full bg-surface-light/80 border border-border/50 flex items-center justify-center text-gray-400 hover:text-white hover:border-cyan/30 transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        )}
      </div>
    </section>
  )
}
