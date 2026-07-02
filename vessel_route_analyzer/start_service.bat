@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%"

echo ====================================================================
echo 선박 항로 및 위협 분석 API 자동 배포를 시작합니다 (Windows)
echo ====================================================================

echo [단계] 1/5 프로젝트 위치 확인
echo [확인] 작업 폴더(레포 루트): %PROJECT_DIR%

echo [단계] 2/5 Docker Desktop 확인
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [에러] Docker Desktop이 설치되어 있지 않거나 PATH에 등록되지 않았습니다.
    echo        먼저 아래 페이지에서 Docker Desktop을 설치한 뒤 다시 실행해 주세요.
    echo        https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [에러] Docker Desktop은 설치되어 있지만 현재 실행 중이 아닙니다.
    echo        Docker Desktop을 켠 뒤 다시 실행해 주세요.
    pause
    exit /b 1
)
echo [확인] Docker 사용 가능

echo [단계] 3/5 Codex CLI 확인
where codex >nul 2>nul
if %errorlevel% neq 0 (
    where npm >nul 2>nul
    if !errorlevel! neq 0 (
        echo [에러] Codex CLI 설치에 필요한 npm이 없습니다.
        echo        먼저 Node.js를 설치해 주세요: https://nodejs.org/
        pause
        exit /b 1
    )

    echo [안내] Codex CLI가 없어 자동 설치를 진행합니다.
    call npm install -g @openai/codex
    if !errorlevel! neq 0 (
        echo [에러] Codex CLI 설치에 실패했습니다.
        pause
        exit /b 1
    )
)
echo [확인] Codex CLI 사용 가능

echo [단계] 4/5 최초 1회 인증 상태 확인
set "AUTH_FOUND=0"
if exist "%USERPROFILE%\.codex\auth.json" set "AUTH_FOUND=1"
if "!AUTH_FOUND!"=="0" (
    if exist "%USERPROFILE%\.gemini" (
        dir /b "%USERPROFILE%\.gemini" >nul 2>nul
        if not errorlevel 1 set "AUTH_FOUND=1"
    )
)
if "!AUTH_FOUND!"=="0" (
    if exist "%USERPROFILE%\.config" (
        dir /s /b "%USERPROFILE%\.config\*codex*" "%USERPROFILE%\.config\*gemini*" "%USERPROFILE%\.config\*openai*" >nul 2>nul
        if not errorlevel 1 set "AUTH_FOUND=1"
    )
)

if "!AUTH_FOUND!"=="1" (
    echo [확인] Codex 인증 세션으로 보이는 파일이 존재합니다.
) else (
    echo [안내] Codex 인증 세션을 찾지 못했습니다.
    echo        지금 한 번만 로그인하면 이후 같은 PC에서 재사용됩니다.
    set /p "RUN_LOGIN=지금 Codex 로그인을 진행하시겠습니까? (y/n):"
    if /i "!RUN_LOGIN!"=="y" (
        call codex
    )

    set "AUTH_FOUND=0"
    if exist "%USERPROFILE%\.codex\auth.json" set "AUTH_FOUND=1"
    if "!AUTH_FOUND!"=="0" (
        if exist "%USERPROFILE%\.gemini" (
            dir /b "%USERPROFILE%\.gemini" >nul 2>nul
            if not errorlevel 1 set "AUTH_FOUND=1"
        )
    )
    if "!AUTH_FOUND!"=="0" (
        if exist "%USERPROFILE%\.config" (
            dir /s /b "%USERPROFILE%\.config\*codex*" "%USERPROFILE%\.config\*gemini*" "%USERPROFILE%\.config\*openai*" >nul 2>nul
            if not errorlevel 1 set "AUTH_FOUND=1"
        )
    )

    if "!AUTH_FOUND!"=="0" (
        echo [경고] 인증 세션이 아직 확인되지 않았습니다.
        echo        컨테이너는 실행할 수 있지만 AI 위험 분석은 fallback 결과를 반환할 수 있습니다.
        set /p "CONTINUE_RUN=그래도 컨테이너를 실행하시겠습니까? (y/n):"
        if /i not "!CONTINUE_RUN!"=="y" (
            echo [중단] 인증 완료 후 start_service.bat를 다시 실행해 주세요.
            pause
            exit /b 1
        )
    ) else (
        echo [완료] 인증 세션 확인 완료
    )
)

echo [단계] 5/5 컨테이너 빌드 및 실행
docker compose up --build -d vessel-analyzer
if %errorlevel% neq 0 (
    echo [에러] docker compose 실행에 실패했습니다.
    pause
    exit /b 1
)

echo ====================================================================
echo 서비스 실행 완료
echo API 주소: http://localhost:8001/api/analyze-route
echo Swagger 문서: http://localhost:8001/docs
echo 컨테이너 로그 확인: docker compose logs -f vessel-analyzer
echo ====================================================================
pause
