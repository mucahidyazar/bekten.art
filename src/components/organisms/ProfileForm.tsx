'use client'
import {zodResolver} from '@hookform/resolvers/zod'
import {Social, User} from '@prisma/client'
import {TrashIcon} from 'lucide-react'
import Image from 'next/image'
import {useSession} from 'next-auth/react'
import {Controller, useFieldArray, useForm} from 'react-hook-form'
import {z} from 'zod'

import {updateUser} from '@/actions'
import {Button} from '@/components/ui/button'
import {Icons} from '@/components/ui/icons'
import {Input} from '@/components/ui/input'
import {getSocialLink} from '@/utils/getSocialLink'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type ProfileFormProps = {
  userDetail: User & {
    socials: Social[]
  }
}
export function ProfileForm({userDetail}: ProfileFormProps) {
  const session = useSession()
  const user = session.data?.user

  const socials = [
    {
      id: user?.id as string,
      platform: 'email',
      value: user?.email as string,
    },
  ]

  userDetail?.socials.forEach(social => {
    if (social.platform !== socials[0].platform) {
      socials.push({
        id: social.id,
        value: social.username,
        platform: social.platform,
      })
    }
  })

  function getIcon(svgName: string) {
    const Icon = Icons[svgName as keyof typeof Icons]
    if (!Icon) Icons.logo
    return Icon
  }

  const validationSchema = z.object({
    name: z.string(),
    image: z.string(),
    profession: z.string(),
    description: z.string(),
    location: z.string(),
    role: z.string().optional(),
    socials: z.array(
      z.object({
        id: z.string(),
        platform: z.string(),
        value: z.string(),
      }),
    ),
  })

  const {
    control,
    formState: {errors},
    watch,
    register,
    handleSubmit,
  } = useForm<{
    name: string
    image: string
    profession: string
    description: string
    location: string
    role: 'ADMIN' | 'ARTIST' | 'USER'
    socials: {id: string; platform: string; value: string}[]
  }>({
    defaultValues: {
      name: (userDetail.name as string) || '',
      image: (userDetail.image as string) || '',
      profession: (userDetail.profession as string) || '',
      description: (userDetail.description as string) || '',
      location: (userDetail.location as string) || '',
      role: userDetail.role,
      socials,
    },
    resolver: zodResolver(validationSchema),
  })
  const values = watch()

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'socials',
  })

  return (
    <form
      className="mb-8 flex flex-col items-center gap-2 text-foreground"
      onSubmit={handleSubmit(data => {
        updateUser({
          ...data,
          socials: data.socials.map(social => ({
            id: social.platform,
            platform: social.platform,
            username: social.value,
            url: getSocialLink(social.platform as any, social.value),
          })),
        })
      })}
    >
      <Image
        src={values.image}
        width={320}
        height={320}
        alt="user avatar"
        className="w-full rounded"
      />
      <Input
        type="text"
        placeholder="Name"
        {...register('name', {required: true})}
      />
      <Input
        type="text"
        placeholder="Image"
        {...register('image', {required: true})}
      />
      <Input
        type="text"
        placeholder="Profession"
        {...register('profession', {required: true})}
      />
      <Input
        type="text"
        placeholder="Description"
        {...register('description', {required: true})}
      />
      <Input
        type="text"
        placeholder="Location"
        {...register('location', {required: true})}
      />
      {userDetail.role === 'ADMIN' && (
        <Controller
          name="role"
          render={({field}) => (
            <Select onValueChange={field.onChange} {...field}>
              <SelectTrigger>
                <SelectValue placeholder={values.role || 'Role'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="ARTIST">ARTIST</SelectItem>
                <SelectItem value="USER">USER</SelectItem>
              </SelectContent>
            </Select>
          )}
          control={control}
        />
      )}

      {/* social links */}
      <div className="mt-2 flex w-full flex-col gap-2">
        <h2 className="text-xs text-foreground">Social links</h2>
        {fields.map((social, socialIndex) => {
          const Icon = getIcon(values.socials[socialIndex].platform)

          return (
            <div
              className="relative flex w-full items-center overflow-hidden rounded border"
              key={social.id}
            >
              <div className="h-8 w-8  p-2 text-xs">
                {Icon && <Icon className="h-full w-fit" />}
              </div>
              <div className="h-full w-[0.1rem] bg-white" />

              <Controller
                render={({field}) => {
                  return (
                    <Input
                      className="h-8 w-20 min-w-[3rem] max-w-[8rem] rounded-none border-none bg-gray-400 text-background outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter your Twitter handle"
                      type="text"
                      style={{
                        width: `${field.value.length + 2}ch`,
                      }}
                      {...field}
                    />
                  )
                }}
                name={`socials.${socialIndex}.platform` as any}
                control={control}
              />
              <p className="-ml-3 -mt-1 text-sm text-background">/</p>
              <Controller
                render={({field}) => {
                  return (
                    <Input
                      className="h-8 w-full flex-1 border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Enter your Twitter handle"
                      type="text"
                      {...field}
                    />
                  )
                }}
                name={`socials.${socialIndex}.value` as any}
                control={control}
              />
              {(social.platform !== 'email' || socialIndex !== 0) && (
                <button
                  type="button"
                  className="absolute right-1 top-[50%] -translate-y-[50%] text-foreground"
                  onClick={() => remove(socialIndex)}
                >
                  <TrashIcon className="w-4" />
                </button>
              )}
            </div>
          )
        })}
        <Button
          type="button"
          variant="link"
          className="flex items-center gap-2 text-xs"
          onClick={() =>
            append({id: Date.now().toString(), platform: '', value: ''})
          }
        >
          Add social link
        </Button>
        <Button variant="destructive" type="submit" className="w-full text-xs">
          Save
        </Button>

        <ul>
          {Object.entries(errors).map(([key, value]) => (
            <li key={key} className="text-xs text-red-500">
              {key}: {value.message}
            </li>
          ))}
        </ul>
      </div>
    </form>
  )
}
