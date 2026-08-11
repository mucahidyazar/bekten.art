import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const aboutRoute = createPublicManagedRoute({kind: 'artist', slug: 'about'})

export const generateMetadata = aboutRoute.generateMetadata

export default aboutRoute.Page
