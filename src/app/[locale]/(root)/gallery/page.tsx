import {GalleryTemplate} from '@/components/templates/GalleryTemplate'
import {prepareMetadata} from '@/utils/prepareMetadata'

export async function generateMetadata() {
  const title = '🎨 Art Gallery - Explore Bekten Usubaliev&apos;s Masterpieces'
  const description =
    '🎨 Step into the gallery of Bekten Usubaliev and witness a collection of art that transcends boundaries, each piece echoing the profound sentiments and dreams of the human spirit.'

  return await prepareMetadata({
    title,
    description,
    page: 'gallery',
  })
}

export const revalidate = 3600

const getPhotos = async () =>
  // {page = 1, perPage = 40}
  {
    var myHeaders = new Headers()
    myHeaders.append('sec-fetch-site', 'same-origin')
    myHeaders.append(
      'user-agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.55',
    )
    myHeaders.append('x-csrftoken', 'zMRyscIvWb7FvpaurwzXgefpFen270SI')
    myHeaders.append('x-ig-app-id', '936619743392459')
    myHeaders.append(
      'Cookie',
      'csrftoken=sQpWIi5wPbYrVieKFFSSp6Zpg1h9CLB8; ds_user_id=58092343572; ig_did=6B21A148-AD98-433A-BA6C-CF56888B7E05; ig_nrcb=1; mid=Y8sRxAAEAAFuKaV9D0hPFGPGEZ6d; rur="CLN\\05458092343572\\0541730353946:01f74698e53eb97c387ab7a40906a235b646116800a0e06dce208c901a4b2b39b727841b"',
    )

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
    }
    try {
      const response = await fetch(
        'https://www.instagram.com/api/v1/users/web_profile_info/?username=bekten_usubaliev',
        requestOptions,
      )
      const data = await response.json()
      return data
    } catch (error) {
      return {
        message: 'We could not fetch the photos. Please try again later.',
        error,
      }
    }
  }

type ImageNodeType = {
  display_url: string
  shortcode: string
  edge_media_to_caption: {
    edges: {
      node: {
        text: string
      }
    }[]
  }
}
type ImageType = {
  node: ImageNodeType
}
type ArtImage = {
  url: string
  title: string
  description: string
}

export default async function Home() {
  const response: any = await getPhotos()

  const data = response?.data

  const images = data?.user?.edge_owner_to_timeline_media?.edges as ImageType[]

  const getImageArrays = (): ArtImage[][] => {
    const arrayOne: ArtImage[] = []
    const arrayTwo: ArtImage[] = []
    const arrayThree: ArtImage[] = []

    images.forEach((image, index) => {
      const artImage = {
        url: image.node.display_url,
        title: image.node.shortcode,
        description:
          image.node?.edge_media_to_caption?.edges[0]?.node?.text || '',
      }
      if (index % 3 === 0) {
        arrayOne.push(artImage)
      } else if (index % 3 === 1) {
        arrayTwo.push(artImage)
      } else if (index % 3 === 2) {
        arrayThree.push(artImage)
      }
    })
    return [arrayOne, arrayTwo, arrayThree]
  }
  const imagesArrays = getImageArrays()

  return (
    <div className="container">
      {/* Header */}
      {/* <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Art Gallery
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Explore a curated collection of artworks that capture emotions, dreams, and the essence of human experience
        </p>
      </div> */}

      {/* Gallery Grid */}
      <div id="gallery" className="px-1 lg:px-4">
        <GalleryTemplate imageArrays={imagesArrays} />
      </div>
    </div>
  )
}

// image structure
// image: {
//   node: {
//     __typename: 'GraphVideo',
//     id: '2981618971838573263',
//     shortcode: 'Clg1qhYAOrP',
//     dimensions: [Object],
//     display_url: 'https://instagram.fist13-1.fna.fbcdn.net/v/t51.2885-15/317119863_133930606131526_7046259578164362345_n.jpg?stp=dst-jpg_e15_fr_p1080x1080&_nc_ht=instagram.fist13-1.fna.fbcdn.net&_nc_cat=110&_nc_ohc=5onFhKXUyewAX-xHUmu&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfA5bro_k3FRQLWJkAv_VHUqCf-d5JjiecfHxzek0gGyDQ&oe=652E773F&_nc_sid=8b3546',
//     edge_media_to_tagged_user: [Object],
//     fact_check_overall_rating: null,
//     fact_check_information: null,
//     gating_info: null,
//     sharing_friction_info: [Object],
//     media_overlay_info: null,
//     media_preview: 'ABgq0WqxH90VlJeh38sjGeAc96vidEABPtUItst0VX+0J70U7okwra38oiR+eR+GavvH3HXNZrGRXwvAXpmrUrspD5XBHT370nFvqU126DAGjl2E5op9sQ8uGIYMMqT1H+elFS0wZn3jMz9+amWFpIOf4TVu5AGPpVZSdj/Stb6FW1sOtY1Dpk8g/h1PFFOsP9X/AMCH86KzlJp2Elc//9k=',
//     owner: [Object],
//     is_video: true,
//     has_upcoming_event: false,
//     accessibility_caption: null,
//     dash_info: [Object],
//     has_audio: true,
//     tracking_token: 'eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiNGJkYTlhNzE0OGNiNGUwN2IxZmU4NzUxMzA1MWY4MDkyOTgxNjE4OTcxODM4NTczMjYzIn0sInNpZ25hdHVyZSI6IiJ9',
//     video_url: 'https://instagram.fist13-1.fna.fbcdn.net/o1/v/t16/f1/m82/A44F3EDEA23D7B29548E0CD093800185_video_dashinit.mp4?efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_ht=instagram.fist13-1.fna.fbcdn.net&_nc_cat=104&vs=5745326775548403_3017863271&_nc_vs=HBksFQIYT2lnX3hwdl9yZWVsc19wZXJtYW5lbnRfcHJvZC9BNDRGM0VERUEyM0Q3QjI5NTQ4RTBDRDA5MzgwMDE4NV92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVABgkR05qMHZSTFhINWZ0bUlzQUFLdXFuQi1ndGNJRmJxX0VBQUFGFQICyAEAKAAYABsAFQAAJsiGxYudz%2BA%2FFQIoAkMzLBdAIiHKwIMSbxgSZGFzaF9iYXNlbGluZV8xX3YxEQB1%2FgcA&ccb=9-4&oh=00_AfBD7rMNLYAJ-rH5jHq1VrV-i-sfhiEOpE02jtV9xtEn0Q&oe=652ED5E7&_nc_sid=8b3546',
//     video_view_count: 776,
//     edge_media_to_caption: [Object],
//     edge_media_to_comment: [Object],
//     comments_disabled: false,
//     taken_at_timestamp: 1669656815,
//     edge_liked_by: [Object],
//     edge_media_preview_like: [Object],
//     location: null,
//     nft_asset_info: null,
//     thumbnail_src: 'https://instagram.fist13-1.fna.fbcdn.net/v/t51.2885-15/317119863_133930606131526_7046259578164362345_n.jpg?stp=c0.420.1080.1080a_dst-jpg_e35_s640x640_sh0.08&_nc_ht=instagram.fist13-1.fna.fbcdn.net&_nc_cat=110&_nc_ohc=5onFhKXUyewAX-xHUmu&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfBox9uh8Ix8L5axHftJwtFkfAWHcs-APUES-ONLyO8EZg&oe=652E773F&_nc_sid=8b3546',
//     thumbnail_resources: [Array],
//     felix_profile_grid_crop: null,
//     coauthor_producers: [],
//     pinned_for_users: [],
//     viewer_can_reshare: true,
//     product_type: 'clips',
//     clips_music_attribution_info: [Object]
//   }
// }
