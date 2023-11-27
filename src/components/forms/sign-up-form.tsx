'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

import {signUpUser} from '@/actions/user'
import {Button} from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {useServerAction} from '@/hooks/useServerAction'

const validationSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(data => {
    return data.confirmPassword === data.password
  })
type FormValues = z.infer<typeof validationSchema>
export function SignUpForm() {
  const [action, isPending] = useServerAction(signUpUser)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(validationSchema),
  })

  const submitHandler = async ({email, password}: FormValues) => {
    await action({email, password})
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitHandler)}
        className="flex flex-col gap-2"
      >
        <FormField
          name="email"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormControl>
                <Input placeholder="example@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormControl>
                <Input placeholder="12345678" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="confirmPassword"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormControl>
                <Input placeholder="12345678" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-2 w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Sign Up
        </Button>
      </form>
    </Form>
  )
}
