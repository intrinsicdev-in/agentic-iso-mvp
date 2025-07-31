#!/bin/bash

echo "🚀 Setting up Agentic ISO for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL and MinIO
echo "📦 Starting PostgreSQL and MinIO with Docker Compose..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! docker exec agentic-iso-db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
sleep 5
echo "✅ MinIO is ready!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client and run migrations
echo "🗄️ Setting up database..."
cd backend
npm run prisma:generate
npm run prisma:migrate

# Seed the database with ISO clauses
echo "🌱 Seeding database with ISO clauses..."
npx ts-node src/scripts/seed-iso-clauses.ts

cd ..

echo ""
echo "🎉 Setup complete! You can now:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "📝 Don't forget to add your OpenAI API key to backend/.env"