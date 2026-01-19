# Tile Set Up - Windows 설치 스크립트
# PowerShell에서 실행: .\install.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  🏗️  Tile Set Up 설치 스크립트" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Node.js 확인
Write-Host "[1/4] Node.js 확인 중..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 설치됨: $nodeVersion" -ForegroundColor Green
    
    # Node.js 버전 체크 (18 이상)
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "⚠️  경고: Node.js 18 이상을 권장합니다. (현재: $nodeVersion)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "   https://nodejs.org 에서 Node.js를 설치해주세요." -ForegroundColor Yellow
    exit 1
}

# npm 확인
Write-Host "`n[2/4] npm 확인 중..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 설치됨: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm이 설치되어 있지 않습니다." -ForegroundColor Red
    exit 1
}

# Expo CLI 확인 및 설치
Write-Host "`n[3/4] Expo CLI 확인 중..." -ForegroundColor Yellow
try {
    $expoVersion = npx expo --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Expo CLI 사용 가능" -ForegroundColor Green
    } else {
        throw "Expo CLI not found"
    }
} catch {
    Write-Host "⚠️  Expo CLI를 전역으로 설치하는 중..." -ForegroundColor Yellow
    npm install -g expo-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Expo CLI 설치 실패" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Expo CLI 설치 완료" -ForegroundColor Green
}

# 의존성 설치
Write-Host "`n[4/4] 프로젝트 의존성 설치 중..." -ForegroundColor Yellow
Write-Host "   (이 작업은 몇 분이 걸릴 수 있습니다...)`n" -ForegroundColor Gray

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ 의존성 설치 실패" -ForegroundColor Red
    Write-Host "   에러 메시지를 확인하고 다시 시도해주세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ 설치 완료!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "다음 명령어로 앱을 실행하세요:" -ForegroundColor Cyan
Write-Host "  npx expo start --clear`n" -ForegroundColor White

Write-Host "또는:" -ForegroundColor Cyan
Write-Host "  npm start`n" -ForegroundColor White

Write-Host "📱 Expo Go 앱을 설치하고 QR 코드를 스캔하세요!" -ForegroundColor Yellow
Write-Host "   - iOS: App Store에서 'Expo Go' 검색" -ForegroundColor Gray
Write-Host "   - Android: Play Store에서 'Expo Go' 검색`n" -ForegroundColor Gray
