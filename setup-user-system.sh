#!/bin/bash

echo "🔐 Setting up Three-Tier User System for ISO Management..."
echo ""

# Navigate to backend directory
cd backend

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run migration script
echo "🗄️ Running organization migration..."
npx ts-node src/scripts/migrate-to-organizations.ts

echo ""
echo "✅ User system setup complete!"
echo ""
echo "🎉 Your three-tier user system is now ready:"
echo ""
echo "📋 User Roles:"
echo "   • SUPER_ADMIN - System-wide administration"
echo "   • ACCOUNT_ADMIN - Organization-level administration"
echo "   • USER - Regular user access"
echo ""
echo "🏢 Organizations:"
echo "   • Multi-tenant architecture"
echo "   • Isolated data per organization"
echo "   • Configurable settings per organization"
echo ""
echo "🔑 Test Credentials:"
echo "   • Super Admin: superadmin@example.com / SuperAdmin123!"
echo "   • Account Admin: admin@example.com / AccountAdmin123!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start the backend: npm run dev"
echo "   2. Start the frontend: cd ../frontend && npm run dev"
echo "   3. Visit http://localhost:3000 to login"
echo ""
echo "⚠️  Remember to secure these credentials in production!"