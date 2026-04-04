import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

export const LoadingSpinner = ({ className, size = 'md', text }: Props) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

// Полноэкранный лоадер для страниц
export const PageLoader = () => (
  <div className="flex h-full min-h-[400px] items-center justify-center">
    <LoadingSpinner size="lg" text="Загрузка..." />
  </div>
)
