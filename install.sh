#!/bin/bash
# Tile Set Up - Mac/Linux 설치 스크립트
# 실행: chmod +x install.sh && ./install.sh

set -e  # 에러 발생 시 중단

echo ""
echo "========================================"
echo "  🏗️  Tile Set Up 설치 스크립트"
echo "========================================"
echo ""

# Node.js 확인
echo "[1/4] Node.js 확인 중..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js 설치됨: $NODE_VERSION"
    
    # Node.js 버전 체크 (18 이상)
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo "⚠️  경고: Node.js 18 이상을 권장합니다. (현재: $NODE_VERSION)"
    fi
else
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "   https://nodejs.org 에서 Node.js를 설치해주세요."
    exit 1
fi

# npm 확인
echo ""
echo "[2/4] npm 확인 중..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm 설치됨: $NPM_VERSION"
else
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi

# Expo CLI 확인
echo ""
echo "[3/4] Expo CLI 확인 중..."
if npx expo --version &> /dev/null; then
    echo "✅ Expo CLI 사용 가능"
else
    echo "⚠️  Expo CLI를 전역으로 설치하는 중..."
    npm install -g expo-cli
    if [ $? -ne 0 ]; then
        echo "❌ Expo CLI 설치 실패"
        exit 1
    fi
    echo "✅ Expo CLI 설치 완료"
fi

# 의존성 설치
echo ""
echo "[4/4] 프로젝트 의존성 설치 중..."
echo "   (이 작업은 몇 분이 걸릴 수 있습니다...)"
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 의존성 설치 실패"
    echo "   에러 메시지를 확인하고 다시 시도해주세요."
    exit 1
fi

echo ""
echo "========================================"
echo "  ✅ 설치 완료!"
echo "========================================"
echo ""

echo "다음 명령어로 앱을 실행하세요:"
echo "  npx expo start --clear"
echo ""

echo "또는:"
echo "  npm start"
echo ""

echo "📱 Expo Go 앱을 설치하고 QR 코드를 스캔하세요!"
echo "   - iOS: App Store에서 'Expo Go' 검색"
echo "   - Android: Play Store에서 'Expo Go' 검색"
echo ""
