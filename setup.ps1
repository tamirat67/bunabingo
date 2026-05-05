# BunaBingoBot Setup Script for Windows
Write-Host "🎰 BunaBingoBot Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Backend
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ..

# Frontend
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Edit backend\.env  — add your BOT_TOKEN and JWT_SECRET"
Write-Host "  2. Start DB:          docker-compose up -d"
Write-Host "  3. Run migrations:    cd backend && npm run db:push && npm run db:seed"
Write-Host "  4. Start backend:     cd backend && npm run dev"
Write-Host "  5. Start frontend:    cd frontend && npm run dev"
Write-Host "`n🤖 Bot will be at http://localhost:3001"
Write-Host "🌐 Mini App at http://localhost:3000`n"
