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

## 주의사항

- `fe`는 소스 볼륨 마운트(`./fe:/app`)로 실행되므로 코드 수정 시 자동 반영되지만, `package.json` 의존성을 바꾼 경우에는 `docker compose up -d --build fe`로 재빌드가 필요합니다.
- `be`는 `mongo`의 헬스체크가 통과한 이후 기동되므로(`depends_on: condition: service_healthy`), Mongo 초기 기동이 느리면 `be`도 잠시 대기 상태가 됩니다.
- `vessel-analyzer`는 컨테이너 내부에서 Codex/Gemini CLI를 실행하기 위해 호스트의 `~/.codex`, `~/.config`, `~/.gemini` 디렉터리를 마운트합니다. 해당 CLI 인증이 로컬에 먼저 되어 있어야 정상 동작합니다.
- `.env` 파일은 민감 정보(API 키, DB 계정)를 포함하므로 절대 커밋하지 않습니다(`.gitignore`에 포함되어 있는지 확인).
