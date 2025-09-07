'use client'

import {zodResolver} from '@hookform/resolvers/zod'
import {SaveIcon} from 'lucide-react'
import {useEffect} from 'react'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Skeleton} from '@/components/ui/skeleton'
import {Textarea} from '@/components/ui/textarea'
import {useContactInfo, useSaveContactInfo} from '@/hooks/use-contact-info'
import {useToast} from '@/hooks/use-toast'

// Zod schema for form validation
const contactInfoSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  address: z.string().min(1, 'Address is required'),
  instagram_url: z
    .string()
    .refine(
      val =>
        !val ||
        val === '' ||
        /^https?:\/\/(www\.)?instagram\.com\/.+/.test(val),
      'Please enter a valid Instagram URL',
    ),
  working_hours: z.string().min(1, 'Working hours are required'),
  map_embed_url: z
    .string()
    .refine(
      val => !val || val === '' || val.includes('google.com/maps'),
      'Please enter a valid Google Maps embed URL',
    ),
})

type ContactInfoFormData = z.infer<typeof contactInfoSchema>

interface ContactManagementProps {
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      name?: string
      avatar_url?: string
    }
    role?: string
  } | null
  initialContactInfo?: ContactInfoFormData | null
}

export default function ContactManagement({
  user,
  initialContactInfo,
}: ContactManagementProps) {
  const {toast} = useToast()

  // Use TanStack Query for data fetching with initial data
  const {
    data: contactInfo,
    isLoading,
    error,
  } = useContactInfo(initialContactInfo)
  const saveContactInfoMutation = useSaveContactInfo()

  // React Hook Form setup
  const form = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      phone: initialContactInfo?.phone || '',
      email: initialContactInfo?.email || '',
      address: initialContactInfo?.address || '',
      instagram_url: initialContactInfo?.instagram_url || '',
      working_hours: initialContactInfo?.working_hours || '',
      map_embed_url: initialContactInfo?.map_embed_url || '',
    },
  })

  // Update form when data is loaded
  useEffect(() => {
    if (contactInfo) {
      form.reset({
        phone: contactInfo.phone || '',
        email: contactInfo.email || '',
        address: contactInfo.address || '',
        instagram_url: contactInfo.instagram_url || '',
        working_hours: contactInfo.working_hours || '',
        map_embed_url: contactInfo.map_embed_url || '',
      })
    }
  }, [contactInfo, form])

  const onSubmit = async (data: ContactInfoFormData) => {
    try {
      await saveContactInfoMutation.mutateAsync(data)
      toast({
        title: 'Success',
        description: 'Contact information saved successfully',
      })
    } catch (error) {
      console.error('Error saving contact info:', error)
      toast({
        title: 'Error',
        description: 'Failed to save contact information',
        variant: 'destructive',
      })
    }
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Information Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load contact information. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="admin-container">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Information Management</CardTitle>
              {user && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Managing contact information as{' '}
                  <span className="text-foreground font-medium">
                    {user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email}
                  </span>
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Phone Number */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        {isLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            placeholder="Enter phone number (e.g., +1 234 567 8900)"
                            className="text-foreground bg-background/50 font-semibold"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        {isLoading ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            type="email"
                            placeholder="Enter email address (e.g., contact@example.com)"
                            className="text-foreground bg-background/50 font-semibold"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : (
                        <Textarea
                          placeholder="Enter full address (street, city, country)"
                          rows={2}
                          className="text-foreground bg-background/50 font-semibold"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instagram URL */}
              <FormField
                control={form.control}
                name="instagram_url"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Input
                          type="url"
                          placeholder="Enter Instagram URL (e.g., https://instagram.com/username)"
                          className="text-foreground bg-background/50 font-semibold"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Working Hours */}
              <FormField
                control={form.control}
                name="working_hours"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Working Hours</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : (
                        <Textarea
                          placeholder="Enter working hours (e.g., Monday - Friday: 9:00 AM - 6:00 PM)"
                          rows={2}
                          className="text-foreground bg-background/50 font-semibold"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Map Embed URL */}
              <FormField
                control={form.control}
                name="map_embed_url"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Google Maps Embed URL</FormLabel>
                    <FormControl>
                      {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                      ) : (
                        <Textarea
                          placeholder="Enter Google Maps embed URL (from Google Maps > Share > Embed a map)"
                          rows={3}
                          className="text-foreground bg-background/50 font-semibold"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveContactInfoMutation.isPending || isLoading}
                  className="min-w-32"
                >
                  {saveContactInfoMutation.isPending ? (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
