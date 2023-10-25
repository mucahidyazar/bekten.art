'use client'
import {UploadIcon} from 'lucide-react'
import {useSession} from 'next-auth/react'
import {useForm} from 'react-hook-form'

import {createArtwork} from '@/actions'
import {ArtworkCard} from '@/components/molecules/ArtworkCard'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
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

export default function Home() {
  const session = useSession()

  const {watch, register, handleSubmit} = useForm({
    defaultValues: {
      images: [],
      name: 'Pride and Prejudice',
      description: 'This is the most impeccable artwork you will ever see.',
      price: 9,
      quantity: 1,
      nftLink: '',
    },
  })
  const values = watch()

  return (
    <div id="store-create" className="flex flex-col gap-4 bg-background">
      <section className="flex justify-between gap-4">
        <aside>
          <ArtworkCard
            artwork={{
              name: values.name,
              description: values.description,
              price: values.price,
              images: values.images,
              nftLink: values.nftLink,
              artist: {
                id: session.data?.user?.id as string,
                name: session.data?.user?.name as string,
                image: session.data?.user?.image as string,
                email: session.data?.user?.email as string,
              },
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
              quantity: data.quantity,
              images: [],
              nftLink: data.nftLink,
              artistId: session.data?.user?.id,
            })
          })}
        >
          <div className="relative h-20 rounded border border-dotted border-gray-600 bg-gray-700 bg-opacity-60 duration-150 hover:bg-opacity-50">
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
          </div>

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
            type="number"
            id="price"
            placeholder="Price"
            {...register('price', {required: true})}
          />
          <Input
            type="number"
            id="quantity"
            placeholder="Quantity"
            {...register('quantity', {required: true})}
          />
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
