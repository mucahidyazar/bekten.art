import { CheerioAPI, load } from 'cheerio'

function metaTagContent(doc: CheerioAPI, type: string, attr: string) {
  return doc(`meta[${attr}='${type}']`).attr(`content`);
}

function getTitle(doc: CheerioAPI) {
  let title =
    metaTagContent(doc, `og:title`, `property`) ||
    metaTagContent(doc, `og:title`, `name`);
  if (!title) {
    title = doc(`title`).text();
  }
  return title;
}

const HTTP_TIMEOUT = 3000;
export async function POST(request: Request) {

  const controller = new AbortController();
  const timeoutId: NodeJS.Timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT);
  try {
    const res = await request.json()

    const link: string = res.link

    const response = await fetch(link, {
      signal: controller.signal
    })
    const data = await response.text()
    const $ = load(data as any)

    const title = getTitle($)
    const description = $('meta[name="description"]').attr('content')
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[itemprop="image"]').attr('content') ||
      '/img/empty-press-image.png'
    const url = $('meta[property="og:url"]').attr('content')

    return Response.json({
      data: {
        title,
        description,
        image,
        url
      }
    })
  } catch (error) {
    console.error(`Error while fetching link preview data: ${error}`)
    return {}
  } finally {
    clearTimeout(timeoutId);
  }
}