'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {EyeIcon, EyeOffIcon, MailIcon, UserIcon} from 'lucide-react'
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
import {createClient} from '@/utils/supabase/client'

const createValidationSchema = (t: any) =>
  z
    .object({
      name: z.string().min(2, t('validation.nameRequired')),
      email: z.string().email(t('validation.emailInvalid')),
      password: z.string().min(8, t('validation.passwordLength')),
      confirmPassword: z.string().min(8, t('validation.passwordConfirm')),
    })
    .refine(data => data.confirmPassword === data.password, {
      message: t('validation.passwordsMatch'),
      path: ['confirmPassword'],
    })

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('forms')
  const {toast} = useToast()

  const validationSchema = createValidationSchema(t)

  type FormValues = z.infer<typeof validationSchema>

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(validationSchema),
  })

  const submitHandler = async ({name, email, password}: FormValues) => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const {error} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      })

      if (error) {
        console.error('Error signing up:', error.message)

        // Show user-friendly error messages
        let errorMessage = 'An error occurred during sign up'

        if (error.message.includes('User already registered')) {
          errorMessage =
            'An account with this email already exists. Please sign in instead'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password should be at least 6 characters long'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address'
        }

        toast({
          title: 'Sign Up Failed',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        // Show success message
        toast({
          title: 'Account Created Successfully!',
          description:
            'Please check your email and click the verification link to activate your account',
        })

        // Clear the form
        form.reset()

        // Redirect to sign in page after a short delay
        setTimeout(() => {
          window.location.href = '/sign-in'
        }, 2000)
      }
    } catch (error) {
      console.error('Sign up error:', error)
      toast({
        title: 'Sign Up Failed',
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
          name="name"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-foreground text-sm font-medium">
                {t('labels.fullName')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <UserIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('placeholders.enterName')}
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
                    placeholder={t('placeholders.createPassword')}
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

        <FormField
          name="confirmPassword"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-foreground text-sm font-medium">
                {t('labels.confirmPassword')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('placeholders.confirmPassword')}
                    className="bg-background border-ring/30 focus:border-primary h-10 pr-10 transition-colors"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showConfirmPassword ? (
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

        <div className="text-muted-foreground text-xs">
          <p dangerouslySetInnerHTML={{__html: t('messages.termsAgreement')}} />
        </div>

        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-full font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-white/20 border-t-white" />
              <span>{t('buttons.creatingAccount')}</span>
            </div>
          ) : (
            t('buttons.createAccount')
          )}
        </Button>
      </form>
    </Form>
  )
}
