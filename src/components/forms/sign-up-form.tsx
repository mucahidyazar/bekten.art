'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {EyeIcon, EyeOffIcon, MailIcon, UserIcon} from 'lucide-react'
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
import {supabase} from '@/lib/supabase'

const validationSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine(data => data.confirmPassword === data.password, {
    message: "Passwords don&apos;t match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof validationSchema>

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })
      
      if (error) {
        console.error('Error signing up:', error.message)
        // TODO: Show error toast
      } else {
        // TODO: Show success message
        console.log('Check your email for verification link')
      }
    } catch (error) {
      console.error('Sign up error:', error)
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
          name="name"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                Full Name
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Enter your full name" 
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
          name="email"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                Email Address
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Enter your email" 
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
                Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password" 
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

        <FormField
          name="confirmPassword"
          control={form.control}
          render={({field}) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                Confirm Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password" 
                    className="pr-10 h-10 bg-background  border-ring/30 focus:border-primary transition-colors"
                    {...field} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

        <div className="text-xs text-muted-foreground">
          <p>
            By creating an account, you agree to our{' '}
            <a href="/terms-of-service" className="text-primary hover:text-primary/80 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="text-primary hover:text-primary/80 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4  border-white/20 border-t-white rounded-full animate-spin" />
              <span>Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </Form>
  )
}