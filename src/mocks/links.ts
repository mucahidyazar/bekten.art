export const LINKS: TLink[] = [
  {
    label: 'Instagram',
    url: 'https://www.instagram.com/bekten_usubaliev',
    icon: 'instagram',
  },
  {
    label: 'Dribble',
    url: 'https://www.pinterest.com/bektenart',
    icon: 'dribble',
  },
  {
    label: 'Email',
    url: 'mailto:bekten@lycos.ru',
    icon: 'email',
  },
  {
    label: 'Phone',
    url: 'tel:+996312530703',
    icon: 'phone',
  },
  {
    label: 'Whatsapp',
    url: "https://wa.me/+996705515258?text=I'm%20interested%20in%20your%20artworks%20for%20sale",
    icon: 'whatsapp',
  },
]

export type TLink = {
  label: string
  url: string
  icon: string
}
