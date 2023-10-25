export type Artwork = {
  name: string
  description: string | null
  images: string[]
  nftLink?: string | null
  price: number
  likes: Like[]
  artist: User
}

export type ArtworkCardProps = {
  artwork: Artwork
}

export type Like = {
  id: string;
  userId: string;
  artworkId: string;
}

export type User = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isAdmin?: boolean
}