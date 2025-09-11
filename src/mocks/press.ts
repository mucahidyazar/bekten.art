export interface PressItem {
  id: string
  title: string
  subtitle?: string
  description: string
  content: string
  image: string
  date: string
  source: string
  url?: string
  category: 'interview' | 'review' | 'feature' | 'news'
}

export const mockPressData: PressItem[] = [
  {
    id: 'press-1',
    title: 'Kyrgyz Artist Bekten Usubaliev Unveils Emotional Depths in Latest Exhibition',
    subtitle: 'A Journey Through Human Emotions',
    description: 'Local art critic explores how Bekten Usubaliev\'s latest works capture the essence of human emotion through traditional and contemporary techniques.',
    content: 'In his latest exhibition, Bekten Usubaliev demonstrates a masterful ability to blend traditional Kyrgyz artistic elements with contemporary emotional expression. His paintings serve as windows into the human soul, revealing layers of emotion that resonate with viewers on a profound level.',
    image: '/img/posts/post-1.jpg',
    date: '2024-01-15',
    source: 'Bishkek Art Review',
    url: 'https://example.com/press-1',
    category: 'review'
  },
  {
    id: 'press-2',
    title: 'Interview: The Philosophy Behind Bekten Usubaliev\'s Art',
    subtitle: 'Understanding the Artist\'s Vision',
    description: 'An in-depth conversation with Bekten Usubaliev about his artistic philosophy, influences, and the role of emotion in contemporary art.',
    content: 'In this exclusive interview, Bekten Usubaliev shares insights into his creative process and discusses how his Kyrgyz heritage influences his contemporary artistic expression. He reveals the deep philosophical underpinnings of his work.',
    image: '/img/posts/post-2.jpg',
    date: '2024-01-10',
    source: 'Central Asian Arts Magazine',
    url: 'https://example.com/press-2',
    category: 'interview'
  },
  {
    id: 'press-3',
    title: 'Rising Star: Bekten Usubaliev\'s Impact on Modern Kyrgyz Art',
    subtitle: 'A New Voice in Contemporary Art',
    description: 'Feature article highlighting Bekten Usubaliev\'s growing influence in the contemporary art scene and his unique approach to cultural expression.',
    content: 'Bekten Usubaliev represents a new generation of Kyrgyz artists who are successfully bridging traditional cultural elements with modern artistic expression. His work has gained recognition both locally and internationally.',
    image: '/img/posts/post-3.jpg',
    date: '2024-01-05',
    source: 'Art Today International',
    url: 'https://example.com/press-3',
    category: 'feature'
  },
  {
    id: 'press-4',
    title: 'Gallery Opening: Emotions Unveiled Exhibition Draws Record Crowds',
    subtitle: 'Unprecedented Interest in Local Art',
    description: 'News coverage of the record-breaking attendance at Bekten Usubaliev\'s latest exhibition opening, highlighting the growing interest in contemporary Kyrgyz art.',
    content: 'The opening night of "Emotions Unveiled" saw unprecedented crowds as art enthusiasts flocked to witness Bekten Usubaliev\'s latest collection. The exhibition has been praised for its emotional depth and technical excellence.',
    image: '/img/posts/post-4.jpg',
    date: '2023-12-20',
    source: 'Bishkek Daily News',
    url: 'https://example.com/press-4',
    category: 'news'
  },
  {
    id: 'press-6',
    title: 'Cultural Heritage Meets Modern Expression in Usubaliev\'s Work',
    subtitle: 'Bridging Tradition and Contemporary Art',
    description: 'Analysis of how Bekten Usubaliev successfully integrates Kyrgyz cultural elements into contemporary artistic expression.',
    content: 'Usubaliev\'s unique approach to blending traditional Kyrgyz motifs with modern artistic techniques creates a distinctive voice in contemporary Central Asian art.',
    image: '/img/posts/post-6.jpg',
    date: '2023-12-10',
    source: 'Cultural Arts Quarterly',
    url: 'https://example.com/press-6',
    category: 'feature'
  },
  {
    id: 'press-7',
    title: 'International Recognition for Kyrgyz Artist Bekten Usubaliev',
    subtitle: 'Global Acclaim for Local Talent',
    description: 'Coverage of international art community\'s growing recognition of Bekten Usubaliev\'s contributions to contemporary art.',
    content: 'International art critics and collectors are taking notice of Usubaliev\'s distinctive style and profound emotional expression, marking him as an artist to watch.',
    image: '/img/posts/post-7.jpg',
    date: '2023-12-05',
    source: 'International Art News',
    url: 'https://example.com/press-7',
    category: 'news'
  },
  {
    id: 'press-8',
    title: 'Art Critic\'s Choice: Bekten Usubaliev\'s Masterful Color Palette',
    subtitle: 'Technical Excellence Meets Emotional Expression',
    description: 'Professional art critic analyzes the technical aspects of Bekten Usubaliev\'s work, focusing on his masterful use of color and composition.',
    content: 'Usubaliev\'s command of color theory and composition creates a visual language that speaks directly to the viewer\'s emotions. His technical skill serves the higher purpose of emotional communication through art.',
    image: '/img/posts/post-8.jpg',
    date: '2023-11-30',
    source: 'Professional Art Review',
    url: 'https://example.com/press-8',
    category: 'review'
  }
]
