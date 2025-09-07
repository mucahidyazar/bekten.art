import {EditIcon, MailIcon, UserIcon} from 'lucide-react'

import {ArtistHero} from '@/components/molecules/artist-hero'
import {RoleBadge} from '@/components/molecules/role-badge'
import {SignOutButton} from '@/components/molecules/sign-out-button'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {createClient, requireAuth} from '@/utils/supabase/server'

type PageProps = {
  params: Promise<{id: string}>
}

interface UserProfile {
  id: string
  email: string
  name?: string
  image?: string
  role: 'USER' | 'ARTIST' | 'ADMIN'
  created_at: string
  updated_at?: string
  // Additional fields for UI (not in DB)
  bio?: string
  location?: string
  website?: string
  last_sign_in_at?: string
  artworks_liked?: number
  collections?: number
  following?: number
  followers?: number
  interests?: string[]
  recent_activities?: Array<{
    id: string
    type: string
    description: string
    created_at: string
  }>
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getRoleInfo(role: 'USER' | 'ARTIST' | 'ADMIN') {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Administrator',
        icon: 'shield' as const,
        color: 'bg-gradient-to-r from-red-500 to-red-600',
      }
    case 'ARTIST':
      return {
        label: 'Artist',
        icon: 'badge' as const,
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      }
    case 'USER':
    default:
      return {
        label: 'User',
        icon: 'user' as const,
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      }
  }
}

export default async function ProfilePage({params}: PageProps) {
  // Require authentication
  const currentUser = await requireAuth()

  // Get profile ID from params
  const {id} = await params

  const supabase = await createClient()

  // Try to get profile from Supabase users table
  const {data: profileData, error} = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
  }

  // If profile exists in Supabase, use it; otherwise create default profile
  const profile: UserProfile = profileData
    ? {
        ...profileData,
        // Add UI-only fields
        bio: 'Art enthusiast and collector. Passionate about contemporary and digital art.',
        location: 'Bishkek, Kyrgyzstan',
        website: 'https://bekten.art',
        last_sign_in_at: currentUser.last_sign_in_at,
        artworks_liked: 12,
        collections: 5,
        following: 3,
        followers: 8,
        interests: [
          'Contemporary Art',
          'Digital Art',
          'Paintings',
          'Sculptures',
          'Photography',
        ],
        recent_activities: [
          {
            id: '1',
            type: 'like',
            description: 'Liked "Mountain Spirits" artwork',
            created_at: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: '2',
            type: 'collection',
            description: 'Added to "Favorites" collection',
            created_at: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: '3',
            type: 'subscribe',
            description: 'Subscribed to newsletter',
            created_at: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      }
    : {
        id: currentUser.id,
        email: currentUser.email || '',
        name:
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          'Anonymous User',
        image:
          currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture,
        bio: 'Art enthusiast and collector. Passionate about contemporary and digital art.',
        location: 'Bishkek, Kyrgyzstan',
        website: 'https://bekten.art',
        role: 'USER' as const,
        created_at: currentUser.created_at,
        last_sign_in_at: currentUser.last_sign_in_at,
        artworks_liked: 12,
        collections: 5,
        following: 3,
        followers: 8,
        interests: [
          'Contemporary Art',
          'Digital Art',
          'Paintings',
          'Sculptures',
          'Photography',
        ],
        recent_activities: [
          {
            id: '1',
            type: 'like',
            description: 'Liked "Mountain Spirits" artwork',
            created_at: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: '2',
            type: 'collection',
            description: 'Added to "Favorites" collection',
            created_at: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: '3',
            type: 'subscribe',
            description: 'Subscribed to newsletter',
            created_at: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      }

  const isOwnProfile = currentUser.id === profile.id

  const roleInfo = getRoleInfo(profile.role)

  return (
    <div className="w-full pt-8">
      <div className="container space-y-8">
        {/* Hero Section */}
        <div className="relative">
          <ArtistHero
            name={profile.name || 'Anonymous User'}
            title={profile.email}
            quote={profile.bio}
            imageUrl={profile.image || '/me.jpg'}
            badges={[
              {icon: roleInfo.icon, label: roleInfo.label, variant: 'default'},
            ]}
          />
        </div>

        {/* Action Buttons - Moved to a better position */}
        <div className="flex justify-center gap-4 pb-8">
          {isOwnProfile ? (
            <>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <EditIcon className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <MailIcon className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          )}
        </div>

        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 border-border/30 rounded-2xl border bg-gradient-to-br p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="!text-primary text-3xl font-bold">
                {profile.artworks_liked || 0}
              </div>
              <div className="!text-muted-foreground mt-2 text-sm font-medium">
                Artworks Liked
              </div>
            </div>
            <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 border-border/30 rounded-2xl border bg-gradient-to-br p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="!text-primary text-3xl font-bold">
                {profile.collections || 0}
              </div>
              <div className="!text-muted-foreground mt-2 text-sm font-medium">
                Collections
              </div>
            </div>
            <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 border-border/30 rounded-2xl border bg-gradient-to-br p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="!text-primary text-3xl font-bold">
                {profile.following || 0}
              </div>
              <div className="!text-muted-foreground mt-2 text-sm font-medium">
                Following
              </div>
            </div>
            <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 border-border/30 rounded-2xl border bg-gradient-to-br p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="!text-primary text-3xl font-bold">
                {profile.followers || 0}
              </div>
              <div className="!text-muted-foreground mt-2 text-sm font-medium">
                Followers
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Profile Details Header */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-lg">
                <CardHeader className="bg-muted/30 border-border/50 border-b pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
                    <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                      <UserIcon className="text-primary h-4 w-4" />
                    </div>
                    <span>Profile Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-4">
                    <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                      <label className="!text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Email
                      </label>
                      <p className="!text-foreground mt-2 text-sm font-medium">
                        {profile.email}
                      </p>
                    </div>

                    <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                      <label className="!text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Role
                      </label>
                      <div className="mt-3">
                        <RoleBadge
                          icon={roleInfo.icon}
                          label={roleInfo.label}
                        />
                      </div>
                    </div>

                    <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                      <label className="!text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        Member Since
                      </label>
                      <p className="!text-foreground mt-2 text-sm font-medium">
                        {formatDate(profile.created_at)}
                      </p>
                    </div>

                    {profile.last_sign_in_at && (
                      <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                        <label className="!text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Last Active
                        </label>
                        <p className="!text-foreground mt-2 text-sm font-medium">
                          {formatDate(profile.last_sign_in_at)}
                        </p>
                      </div>
                    )}

                    {profile.website && (
                      <div className="group from-muted/30 to-muted/20 hover:from-muted/40 hover:to-muted/30 rounded-xl bg-gradient-to-r p-4 transition-colors">
                        <label className="!text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                          Website
                        </label>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 block text-sm font-medium !text-violet-600 hover:underline dark:!text-violet-400"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6 lg:col-span-3">
              {/* Interests */}
              <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-lg">
                <CardHeader className="bg-muted/30 border-border/50 border-b pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
                    <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                      <span className="text-primary text-sm">🎨</span>
                    </div>
                    <span>Interests & Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    {(profile.interests || []).map(interest => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="bg-muted/50 hover:bg-muted/70 border-border/30 !text-foreground rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-lg">
                <CardHeader className="bg-muted/30 border-border/50 border-b pb-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-semibold">
                    <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                      <span className="text-primary text-sm">⚡</span>
                    </div>
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="group bg-muted/30 hover:bg-muted/40 flex items-start space-x-4 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
                      <div className="bg-primary mt-2 h-3 w-3 flex-shrink-0 rounded-full shadow-lg" />
                      <div className="flex-1">
                        <p className="!text-foreground text-sm font-medium">
                          Liked "Mountain Spirits" artwork
                        </p>
                        <p className="!text-muted-foreground mt-1 text-xs">
                          2 days ago
                        </p>
                      </div>
                    </div>
                    <div className="group bg-muted/30 hover:bg-muted/40 flex items-start space-x-4 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
                      <div className="bg-primary mt-2 h-3 w-3 flex-shrink-0 rounded-full shadow-lg" />
                      <div className="flex-1">
                        <p className="!text-foreground text-sm font-medium">
                          Added to "Favorites" collection
                        </p>
                        <p className="!text-muted-foreground mt-1 text-xs">
                          1 week ago
                        </p>
                      </div>
                    </div>
                    <div className="group bg-muted/30 hover:bg-muted/40 flex items-start space-x-4 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
                      <div className="bg-primary mt-2 h-3 w-3 flex-shrink-0 rounded-full shadow-lg" />
                      <div className="flex-1">
                        <p className="!text-foreground text-sm font-medium">
                          Subscribed to newsletter
                        </p>
                        <p className="!text-muted-foreground mt-1 text-xs">
                          2 weeks ago
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
