# Amrit Dhara - Vercel Deployment Guide

## 🚀 Quick Setup

### 1. Database Setup
Choose one of the following cloud databases:

#### Option A: Vercel Postgres (Recommended)
1. In your Vercel project → Storage → Create Database
2. Select PostgreSQL
3. Copy the `DATABASE_URL`

#### Option B: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy the `DATABASE_URL`

#### Option C: PlanetScale
1. Create account at [planetscale.com](https://planetscale.com)
2. Create new database
3. Copy the `DATABASE_URL`

### 2. Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables and add:

```
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Deploy to Vercel
1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically build and deploy

### 4. Run Database Migration
After deployment, run:
```bash
npx prisma db push
```

Or use Vercel's built-in database setup if using Vercel Postgres.

## 📋 Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | Vercel Postgres/Supabase/PlanetScale |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |

## 🔧 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Add your environment variables
5. Run database migrations: `npx prisma db push`
6. Start development: `npm run dev`

## 🚨 Important Notes

- **No custom server**: Uses Next.js API routes for Vercel compatibility
- **PostgreSQL required**: SQLite doesn't work on Vercel
- **Serverless functions**: All API routes have 30-second timeout
- **Environment variables**: Never commit `.env.local` to Git

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check network connectivity

### API Key Issues
- Verify Gemini API key is valid
- Ensure `NEXT_PUBLIC_GEMINI_API_KEY` is set
- Check API quota limits

### Build Issues
- Run `npm install` to update dependencies
- Clear Vercel cache and redeploy
- Check build logs for errors

## 📊 Features Preserved

✅ PDF export functionality
✅ All UI components and pages
✅ Data visualization and charts
✅ Map functionality
✅ AI chatbot (with API key)
✅ Responsive design
✅ PWA features

## 🔄 Database Migration

If migrating from SQLite to PostgreSQL:

1. Export existing data from SQLite
2. Set up PostgreSQL database
3. Update `DATABASE_URL` environment variable
4. Run `npx prisma db push`
5. Import your data to PostgreSQL

## 📞 Support

For issues with:
- **Vercel deployment**: Check Vercel docs
- **Database setup**: Check your database provider docs
- **API keys**: Check Google AI Studio docs