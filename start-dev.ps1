# Start both Backend and Frontend for GeoMine Development

Write-Host "Starting GeoMine Development Servers..." -ForegroundColor Cyan

# Start Backend (FastAPI) in a new window
Write-Host "Starting Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"uv run uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload`""

# Start Frontend (Vite) in a new window
Write-Host "Starting Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8000/docs"
