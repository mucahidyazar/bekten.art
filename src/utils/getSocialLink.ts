const socialLinks = {
  email: 'mailto:',
  phone: 'tel:',
  instagram: 'https://www.instagram.com/',
  dribble: 'https://www.pinterest.com/',
  twitter: 'https://twitter.com/',
  facebook: 'https://www.facebook.com/',
  linkedin: 'https://www.linkedin.com/in/',
  github: 'https://github.com/',
  youtube: 'https://www.youtube.com/channel/',
  behance: 'https://www.behance.net/',
  medium: 'https://medium.com/',
  pinterest: 'https://www.pinterest.com/',
  reddit: 'https://www.reddit.com/user/',
  snapchat: 'https://www.snapchat.com/add/',
  soundcloud: 'https://soundcloud.com/',
  twitch: 'https://www.twitch.tv/',
  vimeo: 'https://vimeo.com/',
  whatsapp: 'https://wa.me/',
  telegram: 'https://t.me/',
  tiktok: 'https://www.tiktok.com/@',
  spotify: 'https://open.spotify.com/user/',
  discord: 'https://discord.com/users/',
} as const

type SocialLinks = keyof typeof socialLinks
export function getSocialLink(platform: SocialLinks, username: string) {
  return `${socialLinks[platform]}${username}`
}