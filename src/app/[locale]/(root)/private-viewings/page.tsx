import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const privateViewingRoute = createPublicManagedRoute({
  inquiryType: 'PRIVATE_VIEWING',
  kind: 'private-viewings',
  slug: 'private-viewings',
})

export const generateMetadata = privateViewingRoute.generateMetadata

export default privateViewingRoute.Page
