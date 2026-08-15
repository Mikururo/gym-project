import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Утилита для объединения классов Tailwind без конфликтов
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
