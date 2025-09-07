'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {EyeIcon, EyeOffIcon, MailIcon} from 'lucide-react'
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
import {createClient} from '@/utils/supabase/client'

type FormValues = {
  email: string
  password: string
}

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('forms')

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
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Error signing in:', error.message)
        // TODO: Show error toast
      } else {
        // Redirect or refresh will be handled by auth state change
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submitHandler)}
        className="space-y-4"
      >
        <FormField
          name="email"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                {t('labels.email')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('placeholders.enterEmail')}
                    className="pl-10 h-10 bg-background  border-ring/30 focus:border-primary transition-colors"
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
              <FormLabel className="text-sm font-medium text-foreground">
                {t('labels.password')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('placeholders.enterPassword')}
                    className="pr-10 h-10 bg-background  border-ring/30 focus:border-primary transition-colors"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-muted text-primary focus:ring-primary"
            />
            <span className="text-muted-foreground">{t('messages.rememberMe')}</span>
          </label>
          <a
            href="#"
            className="text-primary hover:text-primary/80 transition-colors font-medium"
          >
            {t('messages.forgotPassword')}
          </a>
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4  border-white/20 border-t-white rounded-full animate-spin" />
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
