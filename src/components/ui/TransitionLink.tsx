'use client'

import { useState } from 'react'
import Link from 'next/link'
import FullScreenLoader from './FullScreenLoader'

interface TransitionLinkProps {
  href: string
  className?: string
  children: React.ReactNode
  loadingMessage?: string
}

export default function TransitionLink({ href, className, children, loadingMessage = "Loading..." }: TransitionLinkProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleClick = () => {
    setIsTransitioning(true)
  }

  return (
    <>
      {isTransitioning && <FullScreenLoader message={loadingMessage} />}
      <Link href={href} onClick={handleClick} className={className}>
        {children}
      </Link>
    </>
  )
}
