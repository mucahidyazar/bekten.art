import {ArtImage} from '@/components'
import {prepareMetadata} from '@/utils'

export function generateMetadata() {
  const title = '👋🏼 Home'
  const description =
    '👋🏼 Hi, it is Mucahid. I am a frontend developer and creator of some open source projects since 2017. I am h'

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
const getPhotos = async ({page = 1, perPage = 40}) => {
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
      },
    )
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error.response)
    return {}
  }
}

export default async function Home() {
  const response = await getPhotos({page: 1, perPage: 40})
  const data = response?.data

  const images = data?.user?.edge_owner_to_timeline_media?.edges || []
  const getThreeImageArray = () => {
    const arrayOne = []
    const arrayTwo = []
    const arrayThree = []
    // example
    // images = [1,2,3,4,5,6,7,8]
    // arrayOne = [1,4,7]
    // arrayTwo = [2,5,8]
    // arrayThree = [3,6]
    images.forEach((image, index) => {
      console.log({image})
      if (index % 3 === 0) {
        arrayOne.push(image)
      } else if (index % 3 === 1) {
        arrayTwo.push(image)
      } else if (index % 3 === 2) {
        arrayThree.push(image)
      }
    })
    return [arrayOne, arrayTwo, arrayThree]
  }

  return (
    <div
      id="home"
      className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-8 px-1 lg:px-4"
    >
      {getThreeImageArray()?.map((imageArray, imageArrayIndex) => (
        <div
          className="flex flex-col gap-4 lg:gap-8"
          key={imageArrayIndex.toString()}
        >
          {imageArray.map((image, imageIndex) => (
            <ArtImage
              key={imageArrayIndex.toString() + imageIndex.toString()}
              src={image?.node?.display_url}
              description={`https://www.instagram.com/p/${image?.node?.shortcode}`}
              className="h-auto w-full rounded-lg hover:scale-[103%] lg:hover:scale-110 duration-300 saturate-50 hover:saturate-100"
            />
          ))}
        </div>
      ))}
      {/* <div className="flex flex-col gap-4">
        <Image
          src="/usubaliev_1.jpg"
          alt="Bekten Usubaliev"
          width={400}
          height={400}
          className="h-auto w-full"
        />
        <Image
          src="/usubaliev_2.jpg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-48 w-auto"
        />
      </div>
      <div className="flex flex-col gap-4">
        <Image
          src="/img/room/room-0.jpeg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-auto w-full"
        />
        <Image
          src="/img/room/room-1.jpeg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-auto w-full"
        />
        <Image
          src="/img/room/room-2.jpeg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-auto w-full"
        />
      </div>
      <div className="flex flex-col gap-4">
        <Image
          src="/img/room/room-3.jpeg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-auto w-full"
        />
        <Image
          src="/img/room/room-4.jpeg"
          alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
          width={400}
          height={400}
          className="h-auto w-full"
        />
      </div> */}
    </div>
  )
}
