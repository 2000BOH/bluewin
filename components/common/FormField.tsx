// 공통 폼 필드. label + input/textarea/select 한 줄 래퍼.

import { cn } from '@/lib/utils'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

const baseInput =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const baseTextarea =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

type LabelProps = {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export const Field = ({ label, required, hint, children, className }: LabelProps) => (
  <label className={cn('block space-y-1.5', className)}>
    <span className="text-xs font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
  </label>
)

export const TextInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn(baseInput, props.className)} />
)

export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={cn(baseTextarea, props.className)} />
)

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={cn(baseInput, 'cursor-pointer', props.className)} />
)
