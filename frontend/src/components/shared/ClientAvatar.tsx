
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Props {
  firstName: string
  lastName: string
  photoUrl?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-yellow-400',
  'bg-lime-400', 'bg-green-400', 'bg-emerald-400', 'bg-teal-400',
  'bg-cyan-400', 'bg-sky-400', 'bg-blue-400', 'bg-indigo-400',
  'bg-violet-400', 'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400',
]

const getColor = (name: string) => {
  const seed = (name?.charCodeAt(0) || 0)
  return COLORS[seed % COLORS.length]
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' }

export const ClientAvatar = ({ firstName, lastName, photoUrl, className, size = 'md' }: Props) => {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '??'
  const colorClass = getColor(firstName || 'A')

  return (
    <Avatar className={cn(sizes[size], className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt={`${firstName} ${lastName}`.trim()} />}
      <AvatarFallback className={cn(colorClass, 'text-white font-semibold')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
