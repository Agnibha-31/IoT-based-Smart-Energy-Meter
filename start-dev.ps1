# Start both frontend and backend development servers
Write-Host "Starting Smart Meter IoT Dashboard..." -ForegroundColor Green

# Start backend in a new window
Write-Host "`nStarting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\agnib\OneDrive\Desktop\Web dashboard\Smart Meter\backend'; Write-Host 'Backend Server Starting...' -ForegroundColor Yellow; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\agnib\OneDrive\Desktop\Web dashboard\Smart Meter'; Write-Host 'Frontend Server Starting...' -ForegroundColor Yellow; npm run dev"

Write-Host "`n✅ Both servers are starting!" -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor White
Write-Host "`nPress Ctrl+C in each window to stop the servers" -ForegroundColor Gray
