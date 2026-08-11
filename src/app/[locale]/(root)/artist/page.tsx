import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const artistRoute = createPublicManagedRoute({kind: 'artist', slug: 'artist'})

export const generateMetadata = artistRoute.generateMetadata

export default artistRoute.Page
