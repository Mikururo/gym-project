import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Поддерживаем два варианта использования:
// 1. Контролируемый: <ConfirmDialog open={...} onOpenChange={...} ... />
// 2. С триггером:   <ConfirmDialog trigger={<Button>Удалить</Button>} ... />

interface BaseProps {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isLoading?: boolean
  variant?: 'default' | 'destructive'
  // Текстовые алиасы (совместимость со старыми вызовами)
  confirmText?: string
}

interface ControlledProps extends BaseProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: never
}

interface TriggerProps extends BaseProps {
  trigger: React.ReactNode
  open?: never
  onOpenChange?: never
}

type Props = ControlledProps | TriggerProps

export const ConfirmDialog = (props: Props) => {
  const {
    title,
    description,
    confirmLabel,
    confirmText,
    cancelLabel = 'Отмена',
    onConfirm,
    isLoading = false,
    variant = 'destructive',
    trigger,
  } = props

  // Для варианта с trigger — используем внутреннее состояние
  const [internalOpen, setInternalOpen] = useState(false)

  const open = 'open' in props && props.open !== undefined ? props.open : internalOpen
  const onOpenChange = 'onOpenChange' in props && props.onOpenChange
    ? props.onOpenChange
    : setInternalOpen

  const label = confirmLabel ?? confirmText ?? 'Подтвердить'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {isLoading ? 'Загрузка...' : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
