import {prisma} from '@/lib/db'

export type GalleryImage = {
  description: string
  title: string
  url: string
}

function splitIntoColumns(images: GalleryImage[], columnCount = 3) {
  const columns = Array.from({length: columnCount}, () => [] as GalleryImage[])

  images.forEach((image, index) => {
    columns[index % columnCount].push(image)
  })

  return columns
}

export async function getGalleryImageArrays() {
  const posts = await prisma.instagramPost.findMany({
    include: {
      uploaded_file: {
        select: {
          public_url: true,
        },
      },
    },
    orderBy: [
      {display_order: 'asc'},
      {posted_at: 'desc'},
      {created_at: 'desc'},
    ],
    where: {
      is_active: true,
    },
  })

  const images = posts
    .map(post => ({
      description: post.caption || '',
      title: post.shortcode,
      url: post.uploaded_file?.public_url || post.source_display_url,
    }))
    .filter(image => image.url)

  return splitIntoColumns(images)
}
