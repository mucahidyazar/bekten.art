'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

import {createPress} from '@/actions/press'
import {Button} from '@/components/ui/button'
import {useServerAction} from '@/hooks/use-server-action'

import {Input} from '../ui/input'

type CreatePressForm = {
  title: string
  link: string
}

type CreatePressProps = {
  onRequestClose: () => void
}
export default function CreatePress({onRequestClose}: CreatePressProps) {
  const [action, isPending] = useServerAction(createPress)
  const validationSchema = z.object({
    title: z.string().min(4).max(120),
    link: z.string().min(4).max(500),
  })
  const {
    formState: {errors},
    register,
    reset,
    handleSubmit,
  } = useForm<CreatePressForm>({
    defaultValues: {
      title: '',
      link: '',
    },
    resolver: zodResolver(validationSchema),
  })

  return (
    <form
      className="relative flex flex-col gap-2"
      onSubmit={handleSubmit(async data => {
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
        placeholder="Title"
        {...register('title', {required: true})}
      />
      <Input
        id="link"
        placeholder="Link"
        {...register('link', {required: true})}
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
