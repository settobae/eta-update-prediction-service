#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_CMD="docker"

print_line() {
    echo -e "${GREEN}================================================================${NC}"
}

print_step() {
    echo -e "${GREEN}[단계] $1${NC}"
}

has_codex_auth() {
    # Codex CLI의 실제 인증 정보는 ~/.codex/auth.json (CODEX_HOME)에 저장됨
    if [ -f "$HOME/.codex/auth.json" ]; then
        return 0
    fi

    if [ -d "$HOME/.gemini" ] && [ -n "$(find "$HOME/.gemini" -mindepth 1 -print -quit 2>/dev/null)" ]; then
        return 0
    fi

    if [ -d "$HOME/.config" ] && find "$HOME/.config" -maxdepth 3 \( -iname "*codex*" -o -iname "*gemini*" -o -iname "*openai*" \) -print -quit 2>/dev/null | grep -q .; then
        return 0
    fi

    return 1
}

run_compose() {
    if $DOCKER_CMD compose version >/dev/null 2>&1; then
        $DOCKER_CMD compose up --build -d vessel-analyzer
    elif command -v docker-compose >/dev/null 2>&1; then
        docker-compose up --build -d vessel-analyzer
    else
        echo -e "${RED}[에러] Docker Compose를 사용할 수 없습니다. docker compose 또는 docker-compose를 설치해 주세요.${NC}"
        exit 1
    fi
}

print_line
echo -e "${GREEN}선박 항로 및 위협 분석 API 자동 배포를 시작합니다 (Linux)${NC}"
print_line

cd "$PROJECT_DIR"

print_step "1/5 프로젝트 위치 확인"
echo -e "${GREEN}[확인] 작업 폴더(레포 루트): $PROJECT_DIR${NC}"

print_step "2/5 Docker 확인"
if ! command -v docker >/dev/null 2>&1; then
    echo -e "${YELLOW}[안내] Docker가 설치되어 있지 않습니다. Ubuntu 기준 자동 설치를 진행합니다.${NC}"
    if ! command -v apt-get >/dev/null 2>&1; then
        echo -e "${RED}[에러] 이 스크립트는 Ubuntu/Debian 계열의 apt-get 자동 설치만 지원합니다.${NC}"
        echo -e "${RED}        Docker를 먼저 설치한 뒤 스크립트를 다시 실행해 주세요.${NC}"
        exit 1
    fi

    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    if getent group docker >/dev/null 2>&1; then
        sudo usermod -aG docker "$USER" || true
    fi

    echo -e "${YELLOW}[안내] 현재 셸에서 그룹 권한이 반영되지 않을 수 있어 이번 실행은 sudo docker를 사용합니다.${NC}"
fi

if ! docker version >/dev/null 2>&1; then
    echo -e "${YELLOW}[안내] 현재 사용자 권한으로 Docker 접속이 되지 않습니다. sudo 권한으로 계속 진행합니다.${NC}"
    DOCKER_CMD="sudo docker"
fi

echo -e "${GREEN}[확인] Docker 사용 가능${NC}"

print_step "3/5 Codex CLI 확인"
if ! command -v codex >/dev/null 2>&1; then
    echo -e "${YELLOW}[안내] Codex CLI가 없습니다. 호스트 인증 세션 생성을 위해 설치를 시도합니다.${NC}"
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${YELLOW}[안내] npm이 없습니다. Ubuntu 기준 Node.js와 npm을 설치합니다.${NC}"
        if ! command -v apt-get >/dev/null 2>&1; then
            echo -e "${RED}[에러] npm 자동 설치를 지원하지 않는 환경입니다. Node.js와 Codex CLI를 직접 설치해 주세요.${NC}"
            exit 1
        fi
        sudo apt-get update
        sudo apt-get install -y nodejs npm
    fi

    sudo npm install -g @openai/codex
fi
echo -e "${GREEN}[확인] Codex CLI 사용 가능${NC}"

print_step "4/5 최초 1회 인증 상태 확인"
if has_codex_auth; then
    echo -e "${GREEN}[확인] Codex 인증 세션으로 보이는 파일이 존재합니다.${NC}"
else
    echo -e "${YELLOW}[안내] Codex 인증 세션을 찾지 못했습니다.${NC}"
    echo -e "${YELLOW}       지금 한 번만 'codex' 로그인 절차를 완료하면 이후에는 같은 PC에서 재사용됩니다.${NC}"
    read -r -p "지금 Codex 로그인을 진행하시겠습니까? (y/n) " choice
    if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
        codex || true
    fi

    if ! has_codex_auth; then
        echo -e "${RED}[경고] 인증 세션이 아직 확인되지 않았습니다.${NC}"
        echo -e "${RED}       컨테이너는 실행할 수 있지만 AI 위험 분석은 fallback 결과를 반환할 수 있습니다.${NC}"
        read -r -p "그래도 컨테이너를 실행하시겠습니까? (y/n) " continue_choice
        if [[ "$continue_choice" != "y" && "$continue_choice" != "Y" ]]; then
            echo -e "${YELLOW}[중단] 인증 완료 후 스크립트를 다시 실행해 주세요.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}[완료] 인증 세션 확인 완료${NC}"
    fi
fi

print_step "5/5 컨테이너 빌드 및 실행"
run_compose

print_line
echo -e "${GREEN}서비스 실행 완료${NC}"
echo -e "${GREEN}API 주소: http://localhost:8001/api/analyze-route${NC}"
echo -e "${GREEN}Swagger 문서: http://localhost:8001/docs${NC}"
echo -e "${GREEN}컨테이너 로그 확인: docker compose logs -f vessel-analyzer${NC}"
print_line
