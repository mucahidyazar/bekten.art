import { Badge } from '@/components/ui/badge'

import DataTable from '../components/DataTable'

// Mock data for users
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'User',
    status: 'Active',
    joinDate: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2024-01-10',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike@example.com',
    role: 'User',
    status: 'Inactive',
    joinDate: '2024-01-05',
  },
]

export default function AdminUsersPage() {
  return (
    <DataTable
      title="User Management"
      data={mockUsers}
      columns={[
        {key: 'name', label: 'Name', sortable: true},
        {key: 'email', label: 'Email', sortable: true},
        {
          key: 'role',
          label: 'Role',
          render: value => (
            <Badge variant={value === 'Admin' ? 'default' : 'secondary'}>
              {value}
            </Badge>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          render: value => (
            <Badge variant={value === 'Active' ? 'default' : 'secondary'}>
              {value}
            </Badge>
          ),
        },
        {key: 'joinDate', label: 'Join Date', sortable: true},
      ]}
      actions={{
        view: row => console.log('View user:', row),
        edit: row => console.log('Edit user:', row),
        delete: row => console.log('Delete user:', row),
      }}
    />
  )
}
