import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const collectorsRoute = createPublicManagedRoute({
  inquiryType: 'COLLECTOR',
  kind: 'collectors',
  slug: 'collectors',
})

export const generateMetadata = collectorsRoute.generateMetadata

export default collectorsRoute.Page
