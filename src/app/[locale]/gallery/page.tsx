import {GalleryTemplate} from '@/components/templates/GalleryTemplate'
import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Art Gallery - Explore Bekten Usubaliev’s Masterpieces'
  const description =
    '🎨 Step into the gallery of Bekten Usubaliev and witness a collection of art that transcends boundaries, each piece echoing the profound sentiments and dreams of the human spirit.'

  return prepareMetadata({
    title,
    description,
    page: title,
  })
}

// curl 'https://www.instagram.com/api/v1/users/web_profile_info/?username=bekten_usubaliev' \
//   -H 'authority: www.instagram.com' \
//   -H 'accept: */*' \
//   -H 'accept-language: en-US,en;q=0.9' \
//   -H 'cookie: dpr=2; csrftoken=Nw5wog5WQdEiWpN8oVpVLeiOf0BMWsYt; ig_did=1119F0C3-AA49-48C1-BF5D-50773BD64A2C; ig_nrcb=1; mid=ZSwEBwAEAAEXdGEau_Sm4rzqFGPW; datr=BgQsZciRcdabwOeyrIOkhIqa' \
//   -H 'dpr: 2' \
//   -H 'referer: https://www.instagram.com/bekten_usubaliev/' \
//   -H 'sec-ch-prefers-color-scheme: dark' \
//   -H 'sec-ch-ua: "Microsoft Edge";v="117", "Not;A=Brand";v="8", "Chromium";v="117"' \
//   -H 'sec-ch-ua-full-version-list: "Microsoft Edge";v="117.0.2045.55", "Not;A=Brand";v="8.0.0.0", "Chromium";v="117.0.5938.150"' \
//   -H 'sec-ch-ua-mobile: ?0' \
//   -H 'sec-ch-ua-model: ""' \
//   -H 'sec-ch-ua-platform: "macOS"' \
//   -H 'sec-ch-ua-platform-version: "14.0.0"' \
//   -H 'sec-fetch-dest: empty' \
//   -H 'sec-fetch-mode: cors' \
//   -H 'sec-fetch-site: same-origin' \
//   -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.55' \
//   -H 'viewport-width: 1093' \
//   -H 'x-asbd-id: 129477' \
//   -H 'x-csrftoken: Nw5wog5WQdEiWpN8oVpVLeiOf0BMWsYt' \
//   -H 'x-ig-app-id: 936619743392459' \
//   -H 'x-ig-www-claim: 0' \
//   -H 'x-requested-with: XMLHttpRequest' \
//   --compressed
const getPhotos = async () =>
  // {page = 1, perPage = 40}
  {
    try {
      const response = await fetch(
        'https://www.instagram.com/api/v1/users/web_profile_info/?username=bekten_usubaliev',
        {
          method: 'GET',
          headers: {
            authority: 'www.instagram.com',
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            cookie:
              'csrftoken=YND1rzQ1xQFsym8rXjDu2IT9RHWwrpjv; mid=ZSzaAgAEAAFDMHVngWFqcC3aKulj; ig_did=166370A9-C8EB-4DA7-AAF8-57768038E8ED',
            dpr: '2',
            referer: 'https://www.instagram.com/bekten_usubaliev/',
            'sec-ch-prefers-color-scheme': 'dark',
            'sec-ch-ua':
              '"Microsoft Edge";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            'sec-ch-ua-full-version-list':
              '"Microsoft Edge";v="117.0.2045.55", "Not;A=Brand";v="8.0.0.0", "Chromium";v="117.0.5938.150"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': 'macOS',
            'sec-ch-ua-platform-version': '14.0.0',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            user_agent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.55',
            viewport_width: '1093',
            'x-asbd-id': '129477',
            x_csrftoken: 'YND1rzQ1xQFsym8rXjDu2IT9RHWwrpjv',
            x_ig_app_id: '936619743392459',
            x_ig_www_claim: '0',
            'x-requested-with': 'XMLHttpRequest',
          },
          next: {revalidate: 60 * 60 * 24},
        },
      )
      const data = await response.json()
      return data
    } catch (error) {
      return {}
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
  const response = await getPhotos()
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
    <div id="home" className="px-1 lg:px-4">
      <GalleryTemplate imageArrays={imagesArrays} />
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
