'use client'
import {zodResolver} from '@hookform/resolvers/zod'
import {format} from 'date-fns'
import {CalendarIcon} from 'lucide-react'
import {Controller, useForm} from 'react-hook-form'
import {z} from 'zod'

import {createNews} from '@/actions/news'
import {Button} from '@/components/ui/button'
import {useServerAction} from '@/hooks/useServerAction'
import {cn} from '@/utils'

import {Calendar} from '../ui/calendar'
import {Input} from '../ui/input'
import {Popover, PopoverContent, PopoverTrigger} from '../ui/popover'
import {Textarea} from '../ui/textarea'

type CreateNewsForm = {
  title: string
  subtitle: string
  image: string
  location: string
  date: Date | null
  note: string
  address: string
  description: string
}

type CreateNewsProps = {
  onRequestClose: () => void
}
export default function CreateNews({onRequestClose}: CreateNewsProps) {
  const [action, isPending] = useServerAction(createNews)

  const validationSchema = z.object({
    title: z.string().min(4).max(120),
    subtitle: z.string().min(4).max(120),
    image: z.string().min(4).max(120),
    location: z.string().min(4).max(60),
    date: z.date().optional(),
    note: z.string().min(4).max(240),
    address: z.string().min(4).max(240),
    description: z.string().min(4).max(480),
  })
  const {
    formState: {errors},
    control,
    register,
    reset,
    handleSubmit,
  } = useForm<CreateNewsForm>({
    defaultValues: {
      title: '',
      subtitle: '',
      image: '',
      location: '',
      date: null,
      note: '',
      address: '',
      description: '',
    },
    resolver: zodResolver(validationSchema),
  })

  return (
    <form
      className="relative flex flex-col gap-2"
      onSubmit={handleSubmit(data => {
        action(data, {
          onSuccess: () => {
            onRequestClose && onRequestClose()
            reset()
          },
        })
      })}
    >
      <Input
        id="title"
        placeholder="Title*"
        {...register('title', {required: true})}
      />
      <Input
        id="subtitle"
        placeholder="Subtitle*"
        {...register('subtitle', {required: true})}
      />
      <Input
        id="image"
        placeholder="Image"
        {...register('image', {required: true})}
      />
      <Controller
        control={control}
        render={({field}) => (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'pl-3 text-left font-normal',
                  !field.value && 'text-muted-foreground',
                )}
              >
                {field.value ? (
                  format(field.value, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date}
                onSelect={field.onChange}
                // disabled={date =>
                //   date > new Date() || date < new Date('1900-01-01')
                // }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
        name="date"
      />

      <Input
        id="location"
        placeholder="Location: Bishkek, Kyrgyzstan or Moscow, Russia"
        {...register('location', {required: true})}
      />
      <Input
        id="note"
        placeholder="Note"
        {...register('note', {required: true})}
      />
      <Input
        id="address"
        placeholder="Address"
        {...register('address', {required: true})}
      />
      <Textarea
        id="description"
        placeholder="Description*"
        {...register('description', {required: true})}
      />
      <Button type="submit" isLoading={isPending} disabled={isPending}>
        Create
      </Button>

      {!!Object.entries(errors).length && (
        <ul className="text-xs text-red-500">
          {Object.entries(errors).map(([key, value]) => (
            <li key={key}>
              {key}: {value.message}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
