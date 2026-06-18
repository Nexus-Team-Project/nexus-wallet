import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * LazySection — shows a skeleton placeholder until the section enters the
 * viewport (+ rootMargin buffer). Once visible it stays visible forever.
 *
 * rootMargin="300px" fires 300px before the section is scrolled to, giving
 * React time to mount and paint before the user actually sees it.
 */
export default function LazySection({
  skeleton,
  children,
  rootMargin = '300px',
}: {
  skeleton: ReactNode
  children: ReactNode
  rootMargin?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref}>
      {visible ? <div className="animate-fade-in">{children}</div> : skeleton}
    </div>
  )
}
