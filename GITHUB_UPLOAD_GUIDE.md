# 🚀 GitHub 업로드 가이드

## ✅ 현재 상태
- ✅ 프로젝트 파일 모두 준비 완료
- ✅ `.gitignore` 파일 생성 완료
- ⏳ Git 초기화 필요
- ⏳ GitHub 연결 필요

## 📋 단계별 업로드 방법

### 1단계: Git 초기화 및 첫 커밋

**PowerShell에서 실행:**

```powershell
# 프로젝트 폴더로 이동 (한글 경로 문제가 있을 수 있으니 직접 폴더를 열어서 실행하세요)
cd "C:\Users\별\Downloads\tile-setup-project"

# Git 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Tile Setup app - Professional tile installation simulation"
```

### 2단계: GitHub 저장소 연결

```powershell
# 원격 저장소 추가 (이미 저장소가 있다면)
git remote add origin https://github.com/masterpiece33330-prog/Tile-SetUp.git

# 브랜치 이름을 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

### 3단계: 인증 문제 해결

만약 인증 오류가 발생하면:

**방법 1: Personal Access Token 사용 (권장)**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` 체크
4. 토큰 생성 후 복사
5. 비밀번호 입력 시 토큰을 입력

**방법 2: GitHub CLI 사용**
```powershell
# GitHub CLI 설치 후
gh auth login
git push -u origin main
```

**방법 3: SSH 키 사용**
```powershell
# SSH 키가 설정되어 있다면
git remote set-url origin git@github.com:masterpiece33330-prog/Tile-SetUp.git
git push -u origin main
```

## 🔍 문제 해결

### 한글 경로 문제
한글 경로 때문에 PowerShell 명령이 실패할 수 있습니다. 이 경우:
1. 파일 탐색기에서 프로젝트 폴더 열기
2. 주소창에 `powershell` 입력 후 Enter
3. 위 명령어 실행

### Git이 설치되지 않은 경우
```powershell
# Git 설치 확인
git --version

# 설치되지 않았다면
# https://git-scm.com/download/win 에서 다운로드
```

### 이미 원격 저장소가 연결되어 있는 경우
```powershell
# 기존 원격 저장소 확인
git remote -v

# 기존 원격 저장소 제거 후 재설정
git remote remove origin
git remote add origin https://github.com/masterpiece33330-prog/Tile-SetUp.git
```

## ✅ 업로드 확인

업로드가 완료되면:
1. GitHub 저장소 페이지 새로고침
2. 파일들이 보이는지 확인
3. README.md가 제대로 표시되는지 확인

## 📝 다음 단계

업로드 후:
- ✅ `.gitignore`가 제대로 작동하는지 확인 (node_modules가 업로드되지 않아야 함)
- ✅ README.md 업데이트 (필요시)
- ✅ 라이선스 파일 추가 (선택사항)

---

**문제가 발생하면 에러 메시지를 복사해서 알려주세요!** 🚀
