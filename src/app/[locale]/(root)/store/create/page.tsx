'use client'
import {TrashIcon} from '@heroicons/react/24/outline'
import {zodResolver} from '@hookform/resolvers/zod'
import {useSession} from 'next-auth/react'
import {Controller, useFieldArray, useForm} from 'react-hook-form'
import {z} from 'zod'

import {createArtwork} from '@/actions'
import {ArtworkCard} from '@/components/molecules/ArtworkCard'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {isValidImage, isValidImageUrl} from '@/utils/validation'
// import {db} from '@/lib/db'
// import {prepareMetadata} from '@/utils/prepareMetadata'

// export function generateMetadata() {
//   const title =
//     '🎨 Create an artwork - Bekten Usubaliev`s Art Exhibitions & News'
//   const description =
//     '🎨 You can create an artwork here and list it on the website.'

//   return prepareMetadata({
//     title,
//     description,
//     page: 'artwork',
//   })
// }

const validationSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().or(z.number()),
      // test url is a valid image url
      value: z.string().refine(value => isValidImage(value), {
        message: 'Invalid image extension',
      }),
    }),
  ),
  name: z.string(),
  description: z.string(),
  buyLink: z.string().url().or(z.string().optional()),
  price: z.number().optional(),
  nftLink: z.string().url().or(z.string().optional()),
})

export default function Page() {
  const session = useSession()

  const {
    control,
    formState: {errors},
    watch,
    register,
    handleSubmit,
  } = useForm<{
    images: {id: string | number; value: string}[]
    name: string
    description: string
    price: number
    buyLink: string
    nftLink: string
  }>({
    defaultValues: {
      images: [{id: '1', value: ''}],
      name: 'Pride and Prejudice',
      description: 'This is the most impeccable artwork you will ever see.',
      price: 9,
      buyLink: '',
      nftLink: '',
    },
    resolver: zodResolver(validationSchema),
  })
  const values = watch()

  const {fields, append, remove} = useFieldArray({
    control,
    name: 'images',
  })

  const validImages = values.images.filter(image =>
    isValidImageUrl(image.value),
  )

  return (
    <div id="store-create" className="flex flex-col gap-4 bg-background">
      <section className="flex justify-between gap-4">
        <aside>
          <ArtworkCard
            artwork={{
              name: values.name,
              description: values.description,
              price: values.price as number,
              images: validImages.map(image => image.value),
              buyLink: values.buyLink,
              nftLink: values.nftLink,
              createdAt: new Date(),
              updatedAt: new Date(),
              artist: {
                id: session.data?.user?.id as string,
                name: session.data?.user?.name as string,
                image: session.data?.user?.image as string,
                email: session.data?.user?.email as string,
                socials: [],
              } as any,
              likes: [],
            }}
          />
        </aside>

        <form
          className="flex w-full flex-col gap-4"
          onSubmit={handleSubmit(data => {
            // const images = Array.from(data.images).map(image => {
            //   return URL.createObjectURL(image)
            // })
            createArtwork({
              name: data.name,
              description: data.description,
              price: data.price,
              images: data.images.map(image => image.value),
              nftLink: data.nftLink,
            })
          })}
        >
          {/* <div className="relative h-20 rounded border border-dotted border-gray-600 bg-gray-700 bg-opacity-60 duration-150 hover:bg-opacity-50">
            <Input
              type="file"
              id="images"
              multiple
              accept="image/*"
              placeholder="Images"
              {...register('images')}
              className="invisible"
            />
            <UploadIcon
              size={28}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-white"
            />
            <label
              htmlFor="images"
              className="absolute left-0 top-0 h-full w-full cursor-pointer"
            />
          </div> */}
          <div className="flex w-full flex-col items-center gap-4">
            <Button
              onClick={() => append({id: Date.now(), value: ''})}
              className="ml-auto"
            >
              Add Image
            </Button>
            {fields.map((item, index) => (
              <div key={item.id} className="flex w-full flex-col gap-1">
                <Controller
                  render={({field}) => (
                    <div className="relative">
                      <Input {...field} placeholder="Enter image URL" />
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-full w-8 items-center justify-center"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon className="w-4" />
                      </button>
                    </div>
                  )}
                  name={`images.${index}.value` as any} // Controller name değerini doğru formatta yazın
                  control={control}
                />
                {errors.images && errors.images[index] && (
                  <p
                    className="text-xs text-red-500"
                    role="alert"
                    aria-live="assertive"
                  >
                    {errors.images[index]?.value?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
          {/* divider */}
          <hr className="border-gray-600" />

          <Input
            type="text"
            id="name"
            placeholder="Name"
            {...register('name', {required: true})}
          />
          <Input
            type="text"
            id="description"
            placeholder="Description"
            {...register('description', {required: true})}
          />
          <Input
            type="text"
            id="buyLink"
            placeholder="Buy Link (optional)"
            {...register('buyLink')}
          />
          {!!values.buyLink && (
            <Input
              type="number"
              id="price"
              placeholder="Price"
              {...register('price')}
            />
          )}
          <Input
            type="text"
            id="nftLink"
            placeholder="NFT Link (optional)"
            {...register('nftLink')}
          />
          <Button variant="default" type="submit">
            Create
          </Button>
        </form>
      </section>
    </div>
  )
}
