#!/bin/bash

echo "🚀 Deploying CRM System to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create new project or link existing
echo "📦 Setting up Railway project..."
railway link

# Add MySQL plugin
echo "🗄️ Adding MySQL database..."
railway add --plugin mysql

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set SECRET_KEY=$(openssl rand -hex 32)
railway variables set JWT_SECRET_KEY=$(openssl rand -hex 32)

# Deploy the application
echo "🚀 Deploying application..."
railway up

# Get the database URL and update environment
echo "🔗 Getting database connection..."
DB_URL=$(railway variables get DATABASE_URL)
railway variables set SQLALCHEMY_DATABASE_URI="mysql+pymysql://${DB_URL#mysql://}"

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "1. Run database migrations in Railway terminal"
echo "2. Execute: cd backend && python seed.py"
echo "3. Your app will be available at the Railway-provided URL"