# Personal Photo Gallery

A beautiful, private photo gallery with AI-powered features built with Next.js 14, TypeScript, and modern web technologies.

## Features

### 🖼️ Photo Management
- **Multiple Display Modes**: Masonry, Grid, Lightbox, Timeline views
- **Smart Upload**: Drag & drop with automatic processing
- **EXIF Support**: Automatic extraction and display of camera data
- **Multiple Formats**: AVIF, WebP, JPEG with automatic optimization
- **Private/Public**: Fine-grained visibility control

### 🤖 AI-Powered Enhancements
- **Auto Enhancement**: Brightness, contrast, and color balance
- **AI Upscaling**: Super-resolution for better quality
- **Background Removal**: Automatic subject isolation
- **Smart Descriptions**: AI-generated photo descriptions
- **Multiple Providers**: OpenAI, Anthropic, Google support

### 📱 Modern Web Experience
- **Responsive Design**: Mobile-first approach
- **Progressive Web App**: Install on any device
- **Offline Support**: Cached content works offline
- **Dark Mode**: System preference aware theming
- **Fast Loading**: Image optimization and lazy loading

### 🔐 Security & Privacy
- **Authentication**: Secure admin login with 2FA support
- **Access Control**: Public/private photo visibility
- **Audit Logging**: Track all important actions
- **Secure Storage**: S3-compatible object storage

## Tech Stack

### Frontend
- **Next.js 14**: App Router with Server Components
- **React 18**: Modern React with Suspense
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Headless UI**: Accessible components

### Backend
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Robust relational database
- **Redis**: Caching and job queues
- **BullMQ**: Background job processing
- **NextAuth.js**: Authentication framework

### Storage & Processing
- **S3 Compatible**: AWS S3, MinIO, or similar
- **Sharp**: High-performance image processing
- **Multiple AI APIs**: OpenAI, Anthropic, Google
- **CDN Ready**: Cloudflare, Akamai compatible

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- S3-compatible storage

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-photo-gallery
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/photo_gallery"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Storage
   S3_ACCESS_KEY_ID="your-access-key"
   S3_SECRET_ACCESS_KEY="your-secret-key"
   S3_BUCKET_NAME="your-bucket-name"
   S3_REGION="us-east-1"
   S3_ENDPOINT="https://s3.amazonaws.com"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # Admin Account
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="secure-password"
   
   # AI APIs (Optional)
   OPENAI_API_KEY="your-openai-key"
   ANTHROPIC_API_KEY="your-anthropic-key"
   GOOGLE_API_KEY="your-google-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Start the job workers** (in another terminal)
   ```bash
   node -r ts-node/register jobs/worker.ts
   ```

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages
│   ├── admin/             # Admin interface  
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── gallery/          # Gallery components
│   └── admin/            # Admin components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication
│   ├── db.ts             # Database client
│   ├── storage.ts        # File storage
│   ├── image-processing.ts # Image processing
│   └── ai-services.ts    # AI integrations
├── jobs/                  # Background jobs
├── prisma/               # Database schema
└── types/                # TypeScript types
```

## Configuration

### Image Processing
The app automatically generates multiple image variants:
- **Thumbnail**: 300x300 (square crop)
- **Small**: 600px width
- **Medium**: 1200px width  
- **Large**: 2400px width

All variants are generated in AVIF, WebP, and JPEG formats for optimal delivery.

### AI Services
Configure AI providers in your environment:

- **OpenAI**: GPT-4 Vision for descriptions
- **Anthropic**: Claude Vision for descriptions
- **Google**: Gemini Pro Vision for descriptions

### Background Jobs
Jobs are processed asynchronously:
- **Image Processing**: Thumbnail generation, EXIF extraction
- **AI Tasks**: Enhancement, upscaling, background removal

## API Endpoints

### Photos
- `GET /api/photos` - List photos
- `POST /api/upload/presign` - Get upload URL
- `POST /api/upload/commit` - Complete upload

### Images
- `GET /api/image/[id]/[variant]` - Serve optimized images

### AI
- `POST /api/ai/jobs` - Create AI job
- `GET /api/ai/jobs` - List AI jobs
- `GET /api/ai/jobs/[id]` - Get job status

## Development

### Database Changes
```bash
# After modifying prisma/schema.prisma
npm run db:generate
npm run db:migrate
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Deployment

### Environment Setup
- Set up PostgreSQL database
- Configure Redis instance  
- Set up S3-compatible storage
- Configure CDN (optional)

### Scaling Considerations
- Use Redis for session storage
- Scale background job workers
- Configure CDN for static assets
- Monitor storage usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

Built with ❤️ using modern web technologies