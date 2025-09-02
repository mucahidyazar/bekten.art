# bekten.art - Claude Code Instructions

## Project Overview

Overview will be here

## Technology Stack

### Core Framework

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Runtime**: React 19
- **Package Manager**: npm

### Database & Data

- **Database**: SQLite with better-sqlite3
- **Database Location**: `data/the-mafia.db` (dev), `data/the-mafia-test.db`
  (test)
- **ORM**: Native SQL with prepared statements
- **Validation**: Zod schemas
- **Migration**: Custom migration system in `src/lib/database/migrations/`

### UI & Styling

- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Animations**: Built-in Tailwind animations

### State & Forms

- **Client State**: React hooks (useState, useReducer)
- **Server State**: TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner

### AI & Image Generation

- **Image Generation**: Replicate MCP for AI-generated images
- **Static Assets**: Generated images saved to `public/generated/` for reuse

### Internationalization

- **i18n**: next-intl
- **Languages**: English (en), Turkish (tr)
- **Message Files**: `messages/en.json`, `messages/tr.json`

### Authentication & Security

- **Auth**: Custom JWT-based authentication
- **Password**: bcryptjs hashing
- **Middleware**: Custom auth middleware
- **Session**: JWT tokens

## Development Commands

### Database Commands

```bash
npm run db:setup      # Initialize, migrate, and seed development database
npm run db:init       # Initialize database structure
npm run db:migrate    # Run pending migrations
npm run db:seed       # Seed with production data
npm run db:seed:dev   # Seed with development data
npm run db:reset      # Reset database (force flag required)
npm run db:status     # Check migration status
npm run db:stats      # Show database statistics
```

### Development Commands

```bash
npm run dev           # Start development server with Turbopack
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript type checking
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   └── providers/        # Context providers
├── lib/                  # Utilities and core logic
│   ├── auth/             # Authentication logic
│   ├── database/         # Database configuration and migrations
│   └── services/         # Business logic services
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization configuration
└── middleware.ts         # Next.js middleware

data/                     # Database files
messages/                 # Translation files
scripts/                  # Database and utility scripts
```

## Coding Standards

### Follow All .cursor/rules/\*.mdc Files

1. **TypeScript**: Strict typing, prefer interfaces, no any, functional patterns
2. **React/Next.js**: Server Components first, minimal client components, App
   Router patterns, always use latest stable versions
3. **SQLite**: Prepared statements only, transactions for multi-operations,
   repository pattern
4. **Tailwind**: Utility-first, responsive design, shadcn/ui integration
5. **i18n**: All user-facing text translated, organized keys, proper
   interpolation

### Package Management

- **Always use latest stable versions** of all packages and keep dependencies up
  to date

### Image Generation Guidelines

- **Use Replicate MCP** for generating static images when needed
- **Save generated images** to `public/generated/` directory with descriptive
  names
- **Optimize for web** using appropriate formats (WebP, AVIF when possible)
- **Include alt text** for accessibility compliance
- **Cache generated images** to avoid regeneration costs

### Architecture Patterns

- **Repository Pattern**: Database access through service classes
- **Server Components**: Default for all components unless client interactivity
  needed
- **API Routes**: RESTful design with proper HTTP status codes
- **Error Handling**: Graceful error boundaries and user-friendly messages
- **Validation**: Zod schemas for all input validation

## Database Guidelines

### Connection Management

- Always use `getDatabase()` from `src/lib/database/config.ts`
- Never create direct Database instances
- Database uses WAL mode with optimized pragma settings

### Query Patterns

```typescript
// ✅ Correct - Prepared statements
const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
const user = stmt.get(userId)

// ✅ Correct - Transactions
const transaction = db.transaction(users => {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
  for (const user of users) {
    insert.run(user.name, user.email)
  }
})
```

### Security Requirements

- All queries must use prepared statements
- Input validation with Zod schemas
- Password hashing with bcryptjs
- JWT-based authentication
- Foreign key constraints enabled

## Component Development

### Server Components (Default)

```typescript
// ✅ Server Component
export default async function GamePage() {
  const user = await getUserFromDatabase();
  return <GameInterface user={user} />;
}
```

### Client Components (When Needed)

```typescript
// ✅ Client Component with 'use client'
'use client';
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Data Fetching in Client Components

```typescript
// ✅ Use TanStack Query for API calls instead of direct fetch
'use client';
import { useQuery } from '@tanstack/react-query';

export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading user</div>;

  return <div>{user.name}</div>;
}

// ❌ Avoid direct fetch in components
export function UserProfileBad({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### Forms and Validation

```typescript
// ✅ Form with Zod validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const form = useForm({
  resolver: zodResolver(schema),
})
```

## Internationalization

### Translation Usage

```typescript
// ✅ Correct translation usage
const t = useTranslations('combat');
return <button>{t('attackPlayer')}</button>;

// ❌ Never hardcode text
return <button>Attack Player</button>;
```

### Translation Keys Organization

```json
{
  "combat": {
    "attackPlayer": "Attack Player",
    "defendPosition": "Defend Position"
  },
  "errors": {
    "networkError": "Network connection failed"
  }
}
```

## Game-Specific Context

### Core Game Features

- **Combat System**: Player vs player combat with stats and equipment
- **Family System**: Guild-like organizations with hierarchy and communication
- **Business Empire**: Economic gameplay with businesses and territory control
- **Reputation System**: Player rating and review system
- **Achievement System**: Progress tracking and rewards
- **Communication**: Messaging system between players

### Game Entities

- **Players**: User accounts with stats, inventory, and progression
- **Families**: Player organizations with ranks and shared resources
- **Businesses**: Economic entities owned by players
- **Territories**: Controllable areas providing income
- **Items**: Equipment and consumables affecting gameplay
- **Crimes**: Activities that provide resources and experience

## Quality Standards

### Before Completing Tasks

1. Run `npm run type-check` - Ensure zero TypeScript errors
2. Run `npm run lint` - Fix all linting issues
3. Test functionality manually
4. Verify responsive design works
5. Check translations are properly implemented

### Error Handling

- Implement proper error boundaries
- Return user-friendly error messages
- Log errors appropriately for debugging
- Handle edge cases gracefully
- Validate all inputs with Zod

### Performance

- Prefer Server Components
- Use dynamic imports for heavy client components
- Optimize images and assets
- Implement proper caching strategies
- Monitor bundle size

### Image Generation Workflow

```typescript
// ✅ Generate image with Replicate MCP when static image needed
// Example: Generate game character portraits, item icons, backgrounds

// 1. Use Replicate MCP to generate image
// 2. Save to public/generated/ with descriptive filename
// 3. Use Next.js Image component for optimization
import Image from 'next/image';

export function GameCharacter({ name }: { name: string }) {
  return (
    <Image
      src="/generated/character-portrait-warrior.webp"
      alt={`Portrait of ${name}, a warrior character`}
      width={200}
      height={200}
      className="rounded-lg"
    />
  );
}

// ❌ Don't generate images dynamically in production
// ❌ Don't use external URLs for static game assets
// ❌ Don't forget alt text for accessibility
```

## Development Workflow

1. **Planning**: Break down features into components and database changes
2. **Database**: Create/update migrations if schema changes needed
3. **API**: Implement API routes with proper validation
4. **Components**: Build UI components following design system
5. **Integration**: Connect frontend to backend with proper error handling
6. **Testing**: Manual testing and validation
7. **i18n**: Add translations for all user-facing text
8. **Quality**: Run type-check and lint before completion

## Important Notes

- **Never commit automatically** unless explicitly requested
- **Always use absolute paths** for file operations
- **Validate inputs** with Zod schemas before database operations
- **Follow naming conventions**: kebab-case for files, PascalCase for components
- **Use transactions** for multi-step database operations
- **Implement proper loading states** for all async operations
- **Handle errors gracefully** with user-friendly messages
- **Test on multiple screen sizes** for responsive design

## 🎯 **Player Profiles & Reputation** (HIGH PRIORITY)

- Started development of player profiles and reputation system
- Focus on implementing comprehensive player reputation tracking mechanism
