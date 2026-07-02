# Vessel Route & Threat Analyzer

웹 UI 프론트에서 전달한 `출발지/경유지/도착지 + ATD/ETA`를 받아 해상 경로를 만들고, AI가 경로상의 위험 이슈를 조사·검수한 뒤 ETA를 보정하여 반환하는 Docker 기반 백엔드 API입니다.

AI 분석은 2단계로 동작합니다.
- `실행자`: 항로 인근 국가의 주요 방송사/신문사와 국제 주요 언론 기사를 바탕으로 위험 이슈와 지연 근거를 수집합니다.
- `검수자`: 기사 링크 오류, 경로와 무관한 이슈, 과장된 분석 여부를 다시 검토하고 최종 결과를 확정합니다.

## 핵심 기능

- `searoute` 기반 해상 경로 계산
- 대표 10개 좌표 샘플링
- 각 좌표별 KST 도착 예정 시각 계산
- 기사 기반 위험 이슈 분석과 ETA 보정
- 출처 메타데이터 반환: `publisher`, `published_at`, `source_tier`, `verification_status`

## 배포 방식

이 서비스는 **레포 루트의 `compose.yaml`에 `vessel-analyzer` 서비스로 통합**되어 있습니다. 레포 전체를 복사한 뒤 루트에서 스크립트 1개만 실행하면 됩니다.

대상 PC에서 필요한 것은 아래 두 가지입니다.
- 인터넷 연결
- Docker 사용 가능 상태

환경 변수(`GEMINI_API_KEY`, `GEMINI_MODEL_NAME`, `AI_CORS_ALLOW_ORIGINS`)는 이 폴더가 아니라 **레포 루트의 `.env`**에서 관리합니다. 루트 `.env.example`을 참고해 루트 `.env`를 만들어 주세요.

Codex CLI 바이너리는 컨테이너 내부에도 설치되지만, **최초 1회 로그인 세션 확인은 호스트 PC에서 진행**합니다. 스크립트가 이를 자동 점검하고 안내합니다.

## 빠른 배포 절차

### Linux

```bash
chmod +x install_and_run.sh
./install_and_run.sh
```

스크립트가 자동으로 처리하는 일:
- 현재 폴더 기준 실행 위치 확인
- Docker 설치 여부 확인
- 필요 시 Ubuntu 기준 Docker 자동 설치
- Codex CLI 설치 여부 확인
- 필요 시 Codex CLI 설치
- 최초 1회 인증 세션 존재 여부 확인
- 필요 시 `codex` 로그인 유도
- 레포 루트에서 `docker compose up --build -d vessel-analyzer` 실행

### Windows

프로젝트 폴더에서 `start_service.bat`를 더블클릭하거나 CMD에서 실행합니다.

```cmd
start_service.bat
```

배치 파일이 자동으로 처리하는 일:
- Docker Desktop 설치 및 실행 여부 확인
- Codex CLI 설치 여부 확인
- 필요 시 npm 기반 Codex CLI 설치
- 최초 1회 인증 세션 존재 여부 확인
- 필요 시 `codex` 로그인 유도
- 레포 루트에서 `docker compose up --build -d vessel-analyzer` 실행

## 최초 1회 인증

AI 위험 분석이 실제로 동작하려면 대상 PC에서 한 번은 `codex` 로그인 절차를 완료해야 합니다.

스크립트는 아래 경로에 인증 세션으로 보이는 파일이 있는지 자동 확인합니다.
- `~/.codex/auth.json` (Codex CLI의 실제 인증 파일 위치, `CODEX_HOME`)
- `~/.gemini`
- `~/.config` 하위의 `codex`, `gemini`, `openai` 관련 파일

인증 세션이 없으면 스크립트가 `codex` 실행을 유도합니다. 인증이 끝나면 같은 PC에서 이후 재사용됩니다.

인증 없이도 컨테이너는 띄울 수 있지만, 이 경우 AI 위험 분석은 fallback 결과를 반환할 수 있습니다.

## Docker 연결 구조

`vessel-analyzer` 서비스는 레포 루트 `compose.yaml`에 정의되어 있으며, 컨테이너 내부에서는 `codex` CLI가 실행되고 호스트의 인증 세션 디렉토리를 읽기 전용으로 마운트합니다.

```yaml
vessel-analyzer:
  build:
    context: ./vessel_route_analyzer
    dockerfile: Dockerfile
  ports:
    - "8001:8000"
  environment:
    GEMINI_API_KEY: ${GEMINI_API_KEY}
    GEMINI_MODEL_NAME: ${GEMINI_MODEL_NAME}
    CORS_ALLOW_ORIGINS: ${AI_CORS_ALLOW_ORIGINS}
  volumes:
    - ~/.codex:/root/.codex:ro
    - ~/.config:/root/.config:ro
    - ~/.gemini:/root/.gemini:ro
```

`~/.codex`가 Codex CLI의 실제 인증/설정 홈(`CODEX_HOME`)입니다. 이 경로가 마운트되지 않으면 호스트에서 `codex` 로그인을 마쳤어도 컨테이너 내부의 `codex`는 인증 정보를 찾지 못해 항상 fallback 결과만 반환합니다.

즉 구조는 다음과 같습니다.
- 호스트 PC: Docker 실행, 인증 세션 보관, 루트 `.env`에 환경 변수 관리
- 컨테이너 내부: FastAPI 서버 실행(내부 포트 8000, 호스트에는 8001로 노출), `codex` CLI 실행

## API

- API 주소: `http://localhost:8001/api/analyze-route`
- Swagger 문서: `http://localhost:8001/docs`

### Request

`POST /api/analyze-route`

```json
{
  "from": "Busan, Korea",
  "stopover": "Shanghai, China",
  "to": "Manila, Philippines",
  "atd": "2026-06-29T22:52:17.566000",
  "eta": "2026-07-06T22:52:17.566000"
}
```

### Response

```json
{
  "path": [
    {
      "lat": 35.0,
      "lon": 129.2,
      "arrive_at": "2026-06-29T22:52:17.566000+09:00"
    }
  ],
  "summary": {
    "delay_risk": "보통 (주의 - Alert)",
    "total_delay_hours": 12,
    "eta_adjusted": "2026-07-07T10:52:17.566000+09:00",
    "issues": [
      {
        "category": "지정학/해적",
        "location": "대만 해협 (Taiwan Strait)",
        "severity": "Medium",
        "description": "인근국 주요 매체와 국제 주요 매체를 교차 검증한 결과 주의가 필요한 항로 구간입니다.",
        "article_link": "https://www.reuters.com/world/asia-pacific/example-article",
        "publisher": "Reuters",
        "published_at": "2026-07-01T08:30:00Z",
        "source_tier": "Tier 1",
        "verification_status": "verified"
      }
    ],
    "analysis_summary": "실행자 초안을 검수자가 교정한 최종 결과입니다."
  }
}
```

### Frontend Field Spec

#### Request Fields

| Field | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| `from` | `string` | Yes | `Busan, Korea` | 출발지. 항구 또는 도시명 |
| `stopover` | `string \| null` | No | `Shanghai, China` | 경유지. 없으면 생략하거나 `null` |
| `to` | `string` | Yes | `Manila, Philippines` | 목적지. 항구 또는 도시명 |
| `atd` | `string` | Yes | `2026-06-29T22:52:17.566000` | 실제 출발 시각 ATD. ISO 8601 문자열 |
| `eta` | `string` | Yes | `2026-07-06T22:52:17.566000` | 계획 도착 시각 ETA. ISO 8601 문자열 |

#### Response Root Fields

| Field | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| `path` | `array` | Yes | `[{...}]` | 출발지부터 목적지까지 대표 항로 좌표 목록 |
| `summary` | `object` | Yes | `{...}` | 위험 이슈, 지연 정보, 보정 ETA, 최종 분석 요약 |

#### `path[]` Fields

| Field | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| `lat` | `number` | Yes | `35.0` | 위도 |
| `lon` | `number` | Yes | `129.2` | 경도 |
| `arrive_at` | `string` | Yes | `2026-06-29T22:52:17.566000+09:00` | 해당 좌표 도달 예정 시각. KST 기준 |

#### `summary` Fields

| Field | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| `delay_risk` | `string` | Yes | `보통 (주의 - Alert)` | 지연 위험 수준 |
| `total_delay_hours` | `number` | Yes | `12` | 예상 총 지연 시간 |
| `eta_adjusted` | `string` | Yes | `2026-07-07T10:52:17.566000+09:00` | 위험 이슈 반영 후 최종 ETA. KST 기준 |
| `issues` | `array` | Yes | `[{...}]` | 검수 완료된 위험 이슈 목록 |
| `analysis_summary` | `string` | Yes | `실행자 초안을 검수자가 교정한 최종 결과입니다.` | 최종 종합 분석 요약 |

#### `summary.issues[]` Fields

| Field | Type | Required | Example | Description |
| --- | --- | --- | --- | --- |
| `category` | `string` | Yes | `지정학/해적` | 이슈 카테고리. `기상`, `지정학/해적`, `항구정체`, `기타` 중 하나 |
| `location` | `string` | Yes | `대만 해협 (Taiwan Strait)` | 이슈 지역 또는 해역 |
| `severity` | `string` | Yes | `Medium` | 이슈 심각도. `High`, `Medium`, `Low` 중 하나 |
| `description` | `string` | Yes | `인근국 주요 매체와 국제 주요 매체를 교차 검증한 결과...` | 이슈 설명과 ETA 영향 |
| `article_link` | `string` | Yes | `https://www.reuters.com/world/asia-pacific/example-article` | 실제 기사 상세 URL |
| `publisher` | `string` | Yes | `Reuters` | 기사 발행 매체명 |
| `published_at` | `string` | Yes | `2026-07-01T08:30:00Z` | 기사 발행 시각 또는 날짜 |
| `source_tier` | `string` | Yes | `Tier 1` | 출처 등급. `Tier 1`, `Tier 2`, `Tier 3`, `Tier 4` |
| `verification_status` | `string` | Yes | `verified` | 검수 상태. `verified`, `corrected`, `rejected_reference` |

### TypeScript Interfaces

```ts
export interface AnalyzeRouteRequest {
  from: string;
  stopover?: string | null;
  to: string;
  atd: string;
  eta: string;
}

export interface PathPoint {
  lat: number;
  lon: number;
  arrive_at: string;
}

export type IssueCategory = "기상" | "지정학/해적" | "항구정체" | "기타";
export type IssueSeverity = "High" | "Medium" | "Low";
export type SourceTier = "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
export type VerificationStatus = "verified" | "corrected" | "rejected_reference";

export interface IssueItem {
  category: IssueCategory;
  location: string;
  severity: IssueSeverity;
  description: string;
  article_link: string;
  publisher: string;
  published_at: string;
  source_tier: SourceTier;
  verification_status: VerificationStatus;
}

export interface SummaryDetails {
  delay_risk: string;
  total_delay_hours: number;
  eta_adjusted: string;
  issues: IssueItem[];
  analysis_summary: string;
}

export interface AnalyzeRouteResponse {
  path: PathPoint[];
  summary: SummaryDetails;
}
```

## 운영 메모

- Windows에서는 Docker Desktop이 실행 중이어야 합니다.
- Linux 자동 설치 로직은 Ubuntu/Debian 계열을 기준으로 작성되어 있습니다.
- Docker가 이미 설치된 환경이면 스크립트는 설치 단계를 건너뜁니다.
- 최초 빌드 시에는 Python 패키지와 `codex` 설치 때문에 시간이 걸릴 수 있습니다.
- 프로젝트를 다른 PC로 옮길 때 `.venv` 같은 로컬 테스트 산출물은 제외하는 편이 좋습니다.
