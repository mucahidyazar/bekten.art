import {createPublicManagedRoute} from '@/components/public-site/public-managed-route'

const commissionRoute = createPublicManagedRoute({
  inquiryType: 'COMMISSION',
  kind: 'commission',
  slug: 'commission',
})

export const generateMetadata = commissionRoute.generateMetadata

export default commissionRoute.Page
