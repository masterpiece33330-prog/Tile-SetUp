@echo off
REM Tile Set Up - Windows 배치 파일 설치 스크립트
REM 더블클릭으로 실행하거나 명령 프롬프트에서: install.bat

echo.
echo ========================================
echo   🏗️  Tile Set Up 설치 스크립트
echo ========================================
echo.

REM Node.js 확인
echo [1/4] Node.js 확인 중...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org 에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 설치됨: %NODE_VERSION%

REM npm 확인
echo.
echo [2/4] npm 확인 중...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm이 설치되어 있지 않습니다.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 설치됨: %NPM_VERSION%

REM Expo CLI 확인
echo.
echo [3/4] Expo CLI 확인 중...
npx expo --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Expo CLI를 전역으로 설치하는 중...
    npm install -g expo-cli
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Expo CLI 설치 실패
        pause
        exit /b 1
    )
    echo ✅ Expo CLI 설치 완료
) else (
    echo ✅ Expo CLI 사용 가능
)

REM 의존성 설치
echo.
echo [4/4] 프로젝트 의존성 설치 중...
echo    (이 작업은 몇 분이 걸릴 수 있습니다...)
echo.

npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 의존성 설치 실패
    echo    에러 메시지를 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ 설치 완료!
echo ========================================
echo.

echo 다음 명령어로 앱을 실행하세요:
echo   npx expo start --clear
echo.

echo 또는:
echo   npm start
echo.

echo 📱 Expo Go 앱을 설치하고 QR 코드를 스캔하세요!
echo    - iOS: App Store에서 'Expo Go' 검색
echo    - Android: Play Store에서 'Expo Go' 검색
echo.

pause
