'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {EyeIcon, EyeOffIcon, MailIcon} from 'lucide-react'
import {signIn} from 'next-auth/react'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

import {Button} from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {useToast} from '@/components/ui/use-toast'

type FormValues = {
  email: string
  password: string
}

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('forms')
  const {toast} = useToast()

  const validationSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordLength')),
  })

  const form = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(validationSchema),
  })

  const submitHandler = async ({email, password}: FormValues) => {
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Sign In Failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        })

        return
      }

      toast({
        title: t('messages.signInSuccess'),
        description: 'You have been successfully signed in',
      })

      window.location.href = result?.url || '/'
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: 'Sign In Failed',
        description: 'An unexpected error occurred. Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-4">
        <FormField
          name="email"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-foreground text-sm font-medium">
                {t('labels.email')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MailIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('placeholders.enterEmail')}
                    className="bg-background border-ring/30 focus:border-primary h-10 pl-10 transition-colors"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-foreground text-sm font-medium">
                {t('labels.password')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('placeholders.enterPassword')}
                    className="bg-background border-ring/30 focus:border-primary h-10 pr-10 transition-colors"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-full font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-white/20 border-t-white" />
              <span>{t('buttons.signingIn')}</span>
            </div>
          ) : (
            t('buttons.signIn')
          )}
        </Button>
      </form>
    </Form>
  )
}
