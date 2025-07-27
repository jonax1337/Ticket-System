import { UserAvatar } from '@/components/ui/user-avatar'
import { CustomerAvatar } from '@/components/ui/customer-avatar'

// Example test component to showcase avatar functionality
export default function AvatarShowcase() {
  const testUser = {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    avatarUrl: '/uploads/avatars/example.jpg'
  }

  const testUserWithoutAvatar = {
    id: '2', 
    name: 'Jane Doe',
    email: 'jane@example.com',
    avatarUrl: null
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">User Avatars (System Users)</h2>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <UserAvatar user={testUser} size="xl" />
            <p className="mt-2 text-sm">With custom avatar</p>
          </div>
          
          <div className="text-center">
            <UserAvatar user={testUserWithoutAvatar} size="xl" />
            <p className="mt-2 text-sm">Initials fallback</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserAvatar user={testUser} size="lg" />
          <UserAvatar user={testUser} size="md" />
          <UserAvatar user={testUser} size="sm" />
          <span className="text-sm text-muted-foreground">Different sizes</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Customer Avatars (External Users)</h2>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <CustomerAvatar name="Alice Johnson" email="alice@company.com" size="xl" />
            <p className="mt-2 text-sm">Full name initials</p>
          </div>
          
          <div className="text-center">
            <CustomerAvatar name="Bob" email="bob.wilson@email.com" size="xl" />
            <p className="mt-2 text-sm">Single name</p>
          </div>
          
          <div className="text-center">
            <CustomerAvatar name={null} email="customer@support.com" size="xl" />
            <p className="mt-2 text-sm">Email only</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomerAvatar name="Customer" email="test@test.com" size="lg" />
          <CustomerAvatar name="Customer" email="test@test.com" size="md" />
          <CustomerAvatar name="Customer" email="test@test.com" size="sm" />
          <span className="text-sm text-muted-foreground">Different sizes</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Usage Examples</h2>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Ticket Comment</h3>
          <div className="flex items-center gap-2">
            <UserAvatar user={testUser} size="sm" />
            <span className="font-medium">John Smith commented</span>
            <span className="text-xs text-muted-foreground">2 minutes ago</span>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Customer Participant</h3>
          <div className="flex items-center gap-2">
            <CustomerAvatar name="External Customer" email="customer@external.com" size="sm" />
            <span className="font-medium">External Customer</span>
            <span className="text-xs text-muted-foreground">customer@external.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}