# 프로젝트 셋업 및 실행 가이드

## 셋업

### 1. Docker Desktop 설치

이 프로젝트는 `mongo`, `be`(FastAPI), `fe`(Vite/React), `vessel-analyzer`(AI 서버) 4개 컨테이너를 Docker Compose로 함께 띄우는 구조입니다. 먼저 아래에서 OS에 맞는 Docker Desktop을 설치합니다.

- [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop/)
- 설치 후 Docker Desktop을 실행해 정상 구동되는지 확인합니다.

```bash
docker --version
docker compose version
```

### 2. 환경 변수(.env) 설정

루트 디렉터리의 `.env.example`을 복사해 `.env` 파일을 만들고 값을 채워 넣습니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
| --- | --- |
| `MONGO_USERNAME` / `MONGO_PASSWORD` | MongoDB 관리자 계정 정보 |
| `MONGODB_DB` | 사용할 DB 이름 (기본: `cargo_tracker`) |
| `MONGODB_URI` | MongoDB 접속 URI (`mongo`는 compose 내 서비스명이므로 수정 불필요) |
| `APP_NAME` / `APP_VERSION` / `DEBUG` | 백엔드(`be`) 기본 설정 |
| `VITE_API_BASE_URL` | 프론트엔드에서 바라볼 백엔드 API 주소 (`http://localhost:8000`) |
| `CORS_ORIGINS` | 백엔드가 허용할 프론트 Origin (`http://localhost:5173`) |
| `VITE_MAPTILER_API_KEY` / `VITE_MAPTILER_MAP_ID` | 지도 표시용 MapTiler API 키 |
| `AI_API_BASE_URL` | 백엔드가 호출할 AI 서버(`vessel-analyzer`) 주소 |
| `AI_API_TIMEOUT_SECONDS` | AI 서버 호출 타임아웃(초) |
| `GEMINI_API_KEY` / `GEMINI_MODEL_NAME` | vessel-analyzer(AI 서버)에서 사용할 Gemini API 키/모델명 |
| `AI_CORS_ALLOW_ORIGINS` | AI 서버가 허용할 Origin |

> `MONGO_USERNAME`, `MONGO_PASSWORD`, `VITE_MAPTILER_API_KEY`, `GEMINI_API_KEY`는 반드시 값을 채워야 정상 동작합니다.

## 실행

루트 디렉터리에서 Docker Compose로 전체 서비스를 실행합니다.

```bash
docker compose up -d --build
```

- `-d`: 백그라운드 실행
- `--build`: 이미지가 없거나 코드가 변경된 경우 재빌드

실행 후 컨테이너 상태 확인:

```bash
docker compose ps
```

로그 확인:

```bash
docker compose logs -f
docker compose logs -f fe   # 특정 서비스만 확인
```

종료:

```bash
docker compose down
```

### 접속 주소

| 서비스 | 주소 | 설명 |
| --- | --- | --- |
| 프론트엔드 | http://localhost:5173/ | 웹 대시보드 |
| 백엔드 API | http://localhost:8000/ | FastAPI 서버 |
| AI 서버(vessel-analyzer) | http://localhost:8001/ | 경로/지연 분석 서버 |
| MongoDB | localhost:27017 | DB 접속용 (Compass 등) |

## (선택) AI 서버 자동 배포 스크립트 (Linux)

위 "실행" 과정 대신, Linux(Ubuntu/Debian) 환경에서는 `vessel_route_analyzer/install_and_run.sh` 스크립트로 AI 서버(`vessel-analyzer`)만 따로 자동 배포할 수 있습니다. 사전 조건(Docker, Codex CLI, 인증)을 자동으로 점검·설치하고 컨테이너까지 띄워주므로, 실행 전 아래 동작을 먼저 확인하세요.

1. **Docker 확인/설치** — Docker가 없으면 `apt-get` 기준으로 자동 설치를 시도합니다.
2. **Codex CLI 확인/설치** — `codex` 명령이 없으면 npm으로 `@openai/codex`를 전역 설치합니다 (npm이 없으면 Node.js/npm도 함께 설치).
3. **Codex 인증 확인** — `~/.codex/auth.json` 등 인증 파일 존재 여부를 확인합니다. 없으면 최초 1회 로그인(`codex` 명령)을 유도하고, 인증 없이 계속할지 여부를 물어봅니다.
4. **컨테이너 실행** — `docker compose up --build -d vessel-analyzer`로 빌드 및 실행합니다.
5. 완료 후 API 주소(`http://localhost:8001/api/analyze-route`)와 Swagger 문서 경로를 출력합니다.

```bash
chmod +x vessel_route_analyzer/install_and_run.sh
./vessel_route_analyzer/install_and_run.sh
```

> ⚠️ `apt-get`이 있는 Ubuntu/Debian 계열 전용입니다. 다른 OS나 이미 Docker Desktop으로 전체 서비스를 띄운 경우에는 사용할 필요가 없습니다.

> ⚠️ `sudo apt-get install`, `sudo npm install -g` 등 시스템 전역에 영향을 주는 명령이 포함되어 있으므로, 실행 전 스크립트 내용을 한 번 확인하는 것을 권장합니다.

## 주의사항

- `fe`는 소스 볼륨 마운트(`./fe:/app`)로 실행되므로 코드 수정 시 자동 반영되지만, `package.json` 의존성을 바꾼 경우에는 `docker compose up -d --build fe`로 재빌드가 필요합니다.
- `be`는 `mongo`의 헬스체크가 통과한 이후 기동되므로(`depends_on: condition: service_healthy`), Mongo 초기 기동이 느리면 `be`도 잠시 대기 상태가 됩니다.
- `vessel-analyzer`는 컨테이너 내부에서 Codex/Gemini CLI를 실행하기 위해 호스트의 `~/.codex`, `~/.config`, `~/.gemini` 디렉터리를 마운트합니다. 해당 CLI 인증이 로컬에 먼저 되어 있어야 정상 동작합니다.
- `.env` 파일은 민감 정보(API 키, DB 계정)를 포함하므로 절대 커밋하지 않습니다(`.gitignore`에 포함되어 있는지 확인).
