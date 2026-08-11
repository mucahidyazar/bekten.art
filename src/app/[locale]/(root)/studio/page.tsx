import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const studioRoute = createPublicManagedRoute({kind: 'studio', slug: 'studio'})

export const generateMetadata = studioRoute.generateMetadata

export default studioRoute.Page
