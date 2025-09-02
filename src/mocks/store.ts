export interface ArtworkProduct {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  imageUrl: string
  images: string[]
  category: 'painting' | 'digital' | 'print' | 'sculpture'
  medium: string
  dimensions: {
    width: number
    height: number
    depth?: number
    unit: 'cm' | 'in'
  }
  year: number
  isOriginal: boolean
  isLimitedEdition: boolean
  editionSize?: number
  editionNumber?: number
  availability: 'available' | 'sold' | 'reserved'
  tags: string[]
  featured: boolean
}

export const mockStoreData: ArtworkProduct[] = [
  {
    id: '1',
    title: 'Nomadic Dreams',
    description: 'A vibrant exploration of Kyrgyz nomadic traditions through contemporary abstract expressionism. This piece captures the essence of freedom and movement across the vast steppes.',
    price: 2500,
    originalPrice: 3000,
    currency: 'USD',
    imageUrl: '/img/art/art-0.png',
    images: ['/img/art/art-0.png', '/img/art/art-1.png'],
    category: 'painting',
    medium: 'Oil on Canvas',
    dimensions: { width: 80, height: 60, unit: 'cm' },
    year: 2024,
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'available',
    tags: ['abstract', 'nomadic', 'cultural', 'contemporary'],
    featured: true
  },
  {
    id: '2',
    title: 'Mountain Spirits',
    description: 'Inspired by the majestic Tian Shan mountains, this artwork embodies the spiritual connection between nature and human consciousness.',
    price: 1800,
    currency: 'USD',
    imageUrl: '/img/art/art-1.png',
    images: ['/img/art/art-1.png', '/img/art/art-2.png'],
    category: 'painting',
    medium: 'Acrylic on Canvas',
    dimensions: { width: 70, height: 50, unit: 'cm' },
    year: 2024,
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'available',
    tags: ['landscape', 'spiritual', 'mountains', 'nature'],
    featured: true
  },
  {
    id: '3',
    title: 'Digital Horizons',
    description: 'A modern interpretation of traditional Kyrgyz patterns through digital artistry, bridging ancient wisdom with contemporary technology.',
    price: 450,
    currency: 'USD',
    imageUrl: '/img/art/art-2.png',
    images: ['/img/art/art-2.png'],
    category: 'digital',
    medium: 'Digital Art Print',
    dimensions: { width: 40, height: 30, unit: 'cm' },
    year: 2024,
    isOriginal: false,
    isLimitedEdition: true,
    editionSize: 50,
    editionNumber: 12,
    availability: 'available',
    tags: ['digital', 'patterns', 'modern', 'limited'],
    featured: false
  },
  {
    id: '4',
    title: 'Cultural Fusion',
    description: 'An exploration of the intersection between traditional Kyrgyz culture and modern artistic expression.',
    price: 2200,
    currency: 'USD',
    imageUrl: '/img/art/art-3.png',
    images: ['/img/art/art-3.png', '/img/art/art-4.png'],
    category: 'painting',
    medium: 'Mixed Media on Canvas',
    dimensions: { width: 75, height: 55, unit: 'cm' },
    year: 2023,
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'available',
    tags: ['cultural', 'fusion', 'traditional', 'contemporary'],
    featured: false
  },
  {
    id: '5',
    title: 'Eternal Steppe',
    description: 'A masterpiece capturing the endless beauty and tranquility of the Kyrgyz steppes during golden hour.',
    price: 3500,
    currency: 'USD',
    imageUrl: '/img/art/art-4.png',
    images: ['/img/art/art-4.png'],
    category: 'painting',
    medium: 'Oil on Canvas',
    dimensions: { width: 100, height: 70, unit: 'cm' },
    year: 2023,
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'sold',
    tags: ['landscape', 'steppe', 'golden-hour', 'masterpiece'],
    featured: true
  },
  {
    id: '6',
    title: 'Urban Reflections',
    description: 'A contemporary piece reflecting the modern urban landscape of Bishkek through abstract geometric forms.',
    price: 1200,
    currency: 'USD',
    imageUrl: '/img/art/art-5.png',
    images: ['/img/art/art-5.png', '/img/art/art-6.png'],
    category: 'painting',
    medium: 'Acrylic on Canvas',
    dimensions: { width: 60, height: 45, unit: 'cm' },
    year: 2024,
    isOriginal: true,
    isLimitedEdition: false,
    availability: 'reserved',
    tags: ['urban', 'geometric', 'contemporary', 'abstract'],
    featured: false
  }
]

export const storeCategories = [
  { id: 'all', name: 'All Artworks', count: mockStoreData.length },
  { id: 'painting', name: 'Paintings', count: mockStoreData.filter(item => item.category === 'painting').length },
  { id: 'digital', name: 'Digital Art', count: mockStoreData.filter(item => item.category === 'digital').length },
  { id: 'print', name: 'Prints', count: mockStoreData.filter(item => item.category === 'print').length },
  { id: 'sculpture', name: 'Sculptures', count: mockStoreData.filter(item => item.category === 'sculpture').length }
]
