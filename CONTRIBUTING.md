# Contributing to CCFrame

Thank you for your interest in contributing to CCFrame! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Git
- Code editor (VS Code recommended)

### Development Setup

1. **Fork and clone**
```bash
git clone https://github.com/your-username/ccframe.git
cd ccframe
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with local PostgreSQL credentials
```

4. **Initialize database**
```bash
npx prisma migrate dev
npx prisma generate
npm run seed
```

5. **Start dev server**
```bash
npm run dev
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Messages

Follow conventional commits:

```
feat: add photo batch delete functionality
fix: resolve upload progress bar not updating
docs: update deployment guide
refactor: simplify image processing logic
test: add tests for auth middleware
```

### Pull Request Process

1. **Create a branch**
```bash
git checkout -b feature/your-feature
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: your feature description"
```

3. **Push and create PR**
```bash
git push origin feature/your-feature
```

4. **Fill out PR template** with:
   - Clear description of changes
   - Related issue number
   - Screenshots (if UI changes)
   - Testing evidence

5. **Wait for review**
   - Address review comments
   - Keep PR up to date with main branch

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Enable strict mode compliance

```typescript
// Good
interface PhotoUpload {
  file: File;
  title?: string;
  tags?: string[];
}

// Avoid
function uploadPhoto(data: any) { ... }
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Implement proper error boundaries

```tsx
// Component structure
interface Props {
  photo: Photo;
  onDelete: (id: string) => void;
}

export function PhotoCard({ photo, onDelete }: Props) {
  // hooks
  // handlers
  // render
}
```

### API Routes

- Use proper HTTP methods
- Implement error handling
- Return consistent response format
- Add rate limiting where needed

```typescript
// API response format
type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};
```

### Database

- Use Prisma for all database operations
- Create migrations for schema changes
- Add indexes for performance
- Use transactions for multi-step operations

```bash
# Create migration
npx prisma migrate dev --name add_photo_index
```

### Styling

- Use Tailwind CSS utility classes
- Follow design system in tailwind.config.ts
- Keep responsive design in mind
- Use CSS variables for theme colors

## Testing

### Running Tests

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Writing Tests

- Add tests for new features
- Test edge cases and error scenarios
- Keep tests isolated and independent

## Project Structure

```
ccframe/
├── app/                 # Next.js App Router
│   ├── (public)/       # Public pages
│   ├── admin/          # Admin pages
│   └── api/            # API routes
├── components/         # Reusable components
│   ├── gallery/       # Gallery components
│   ├── admin/         # Admin components
│   └── ui/            # UI primitives
├── lib/               # Utilities
│   ├── db.ts         # Database client
│   ├── auth.ts       # Auth helpers
│   └── utils.ts      # General utils
├── prisma/           # Database schema
└── scripts/          # Utility scripts
```

## Common Tasks

### Adding a New Page

1. Create page in appropriate directory
2. Follow App Router conventions
3. Add to navigation if needed
4. Update README if major feature

### Adding a New API Endpoint

1. Create route.ts in app/api/
2. Implement proper types
3. Add authentication if needed
4. Handle errors properly
5. Document in API docs

### Database Schema Changes

1. Update prisma/schema.prisma
2. Create migration:
```bash
npx prisma migrate dev --name your_change
```
3. Update types and queries
4. Test migration on fresh DB

### Adding Dependencies

1. Consider bundle size impact
2. Check for security vulnerabilities
3. Use exact versions
4. Document why it's needed

```bash
npm install --save-exact package-name
```

## Performance Guidelines

- Optimize images (use Cloudflare transforms)
- Implement proper pagination
- Use lazy loading for images
- Minimize client-side JavaScript
- Add proper caching headers

## Security Guidelines

- Never commit sensitive data
- Validate all user inputs
- Use parameterized queries (Prisma does this)
- Implement rate limiting
- Keep dependencies updated

## Documentation

- Update README for major changes
- Add JSDoc comments for complex functions
- Document API changes
- Update deployment guide if needed

## Need Help?

- Check existing issues
- Review documentation
- Ask in discussions
- Create detailed issue if stuck

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
