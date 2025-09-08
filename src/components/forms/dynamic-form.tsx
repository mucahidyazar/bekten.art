'use client'

import Image from 'next/image'

import {zodResolver} from '@hookform/resolvers/zod'
import {ImageIcon, Loader2} from 'lucide-react'
import {FieldValues, Path, useForm} from 'react-hook-form'
import {z} from 'zod'

import {Button} from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'

export function DynamicForm<T extends Record<string, any>>({
  fields,
  schema,
  onSubmit,
  defaultValues,
  submitText = 'Submit',
  isLoading = false,
  onImageSelect,
  className,
}: DynamicFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as any,
  })

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const renderField = (field: FormFieldConfig) => {
    const {
      name,
      label,
      type,
      placeholder,
      description,
      required,
      options,
      rows,
    } = field

    return (
      <FormField
        key={name}
        control={form.control as any}
        name={name as Path<T>}
        render={({field: formField}) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (type) {
                  case 'input':
                    return (
                      <Input
                        placeholder={placeholder}
                        {...formField}
                        disabled={isLoading}
                      />
                    )

                  case 'textarea':
                    return (
                      <Textarea
                        placeholder={placeholder}
                        rows={rows || 3}
                        {...formField}
                        disabled={isLoading}
                      />
                    )

                  case 'select':
                    return options ? (
                      <Select
                        onValueChange={formField.onChange}
                        defaultValue={formField.value}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null

                  case 'image':
                    return (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder={placeholder || 'Image URL'}
                            {...formField}
                            disabled={isLoading}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onImageSelect?.(name)}
                            disabled={isLoading}
                            className="h-10 w-10 shrink-0"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        {formField.value && (
                          <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                            <Image
                              src={formField.value}
                              alt="Preview"
                              fill
                              className="object-cover"
                              onError={e => {
                                const target = e.target as HTMLImageElement

                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )

                  default:
                    return null
                }
              })()}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit as any)}
        className={`space-y-6 ${className || ''}`}
      >
        {fields.map(renderField)}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitText}
          </Button>
        </div>
      </form>
    </Form>
  )
}

type DynamicFormProps<T extends FieldValues> = {
  fields: FormFieldConfig[]
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  defaultValues?: Partial<T>
  submitText?: string
  isLoading?: boolean
  onImageSelect?: (fieldName: string) => void
  className?: string
}

export type FormFieldConfig = {
  name: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'image'
  placeholder?: string
  description?: string
  required?: boolean
  options?: {value: string; label: string}[]
  rows?: number
  accept?: string
}

// Common field presets
export const FormFieldPresets = {
  title: (required = true): FormFieldConfig => ({
    name: 'title',
    label: 'Title',
    type: 'input',
    placeholder: 'Enter title...',
    required,
  }),

  description: (required = false): FormFieldConfig => ({
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Enter description...',
    rows: 4,
    required,
  }),

  image: (required = false): FormFieldConfig => ({
    name: 'url',
    label: 'Image',
    type: 'image',
    placeholder: 'Enter image URL or select from gallery...',
    required,
  }),

  status: (): FormFieldConfig => ({
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      {value: 'active', label: 'Active'},
      {value: 'inactive', label: 'Inactive'},
      {value: 'draft', label: 'Draft'},
    ],
    required: true,
  }),
}

// Helper function to create form field configs
export const createFormField = (config: FormFieldConfig): FormFieldConfig =>
  config
