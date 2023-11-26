import { SOCIAL_LINKS, SocialLinks } from "@/constants";

export function getSocialLink(platform: SocialLinks, username: string) {
  return `${SOCIAL_LINKS[platform](username)}`
}