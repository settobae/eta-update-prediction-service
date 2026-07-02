import asyncio
import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

# Open-Meteo: API 키 없이 사용 가능한 기상/해양 예보 API
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

# 해상 물류 기준 임계값 (지연 시간 산출은 app.services.delay_policy의 단일 기준을 따름)
HIGH_WIND_MS = 17.2      # 강풍 (약 34kt, Beaufort 8 '갈전풍')
HIGH_WAVE_M = 4.0
MODERATE_WIND_MS = 10.8  # 약 21kt, Beaufort 6 '강풍'
MODERATE_WAVE_M = 2.5


def _nearest_hour_index(times: list, target_utc: datetime, max_diff_hours: float = 24.0):
    """예보 시간 배열에서 target_utc와 가장 가까운 인덱스를 찾는다. 예보 범위를 벗어나면 None."""
    best_idx, best_diff = None, None
    for i, t in enumerate(times):
        try:
            t_dt = datetime.fromisoformat(t).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        diff = abs((t_dt - target_utc).total_seconds())
        if best_diff is None or diff < best_diff:
            best_idx, best_diff = i, diff
    if best_diff is not None and best_diff <= max_diff_hours * 3600:
        return best_idx
    return None


async def _fetch_batch(client: httpx.AsyncClient, url: str, lats: list, lons: list, hourly_field: str):
    """
    여러 좌표를 콤마로 구분해 단 한 번의 요청으로 조회한다.
    (좌표마다 개별 요청을 보내면 요청 수가 배로 늘어 Open-Meteo 요청 빈도 제한(429)에 걸리기 쉬움)
    """
    try:
        resp = await client.get(url, params={
            "latitude": ",".join(str(v) for v in lats),
            "longitude": ",".join(str(v) for v in lons),
            "hourly": hourly_field,
            "forecast_days": 10,
            "timezone": "UTC",
        })
        resp.raise_for_status()
        data = resp.json()
        # 좌표가 1개면 dict, 여러 개면 list로 반환됨 (Open-Meteo 사양)
        return data if isinstance(data, list) else [data]
    except httpx.HTTPError as e:
        logger.warning("기상 API 배치 호출 실패 | url=%s err=%s", url, e)
        return None


async def get_weather_issues(points_with_eta: list) -> list:
    """
    항로 대표 좌표별 예상 도착 시각을 기준으로 Open-Meteo 기상/파고 예보를 조회하여
    임계값을 넘는 지점을 위험 이슈로 변환한다. (뉴스 검색이 아닌 실측 기상 데이터 기반)
    좌표 전체를 배치 요청 2건(기상 1건 + 해양 1건)으로 한 번에 조회한다.
    지연 시간 산출은 app.services.delay_policy의 단일 기준을 따르므로 여기서는 severity만 매긴다.
    반환: issues: list[dict]
    """
    if not points_with_eta:
        return []

    lats = [p["lat"] for p in points_with_eta]
    lons = [p["lon"] for p in points_with_eta]

    async with httpx.AsyncClient(timeout=15.0) as client:
        weather_batch, marine_batch = await asyncio.gather(
            _fetch_batch(client, FORECAST_URL, lats, lons, "windspeed_10m"),
            _fetch_batch(client, MARINE_URL, lats, lons, "wave_height"),
        )

    logger.info(
        "기상 API 배치 조회 완료 | 지점=%d개 forecast_ok=%s marine_ok=%s",
        len(points_with_eta), weather_batch is not None, marine_batch is not None
    )

    issues = []

    for idx, point in enumerate(points_with_eta):
        try:
            arrive_dt = datetime.fromisoformat(point["arrive_at"]).astimezone(timezone.utc)
        except ValueError:
            continue

        wind_hourly = weather_batch[idx].get("hourly", {}) if weather_batch and idx < len(weather_batch) else {}
        wave_hourly = marine_batch[idx].get("hourly", {}) if marine_batch and idx < len(marine_batch) else {}

        wind_idx = _nearest_hour_index(wind_hourly.get("time", []), arrive_dt)
        wave_idx = _nearest_hour_index(wave_hourly.get("time", []), arrive_dt)

        wind_kmh_list = wind_hourly.get("windspeed_10m", [])
        wave_m_list = wave_hourly.get("wave_height", [])

        wind_ms = (wind_kmh_list[wind_idx] / 3.6) if wind_idx is not None and wind_idx < len(wind_kmh_list) else None
        wave_m = wave_m_list[wave_idx] if wave_idx is not None and wave_idx < len(wave_m_list) else None

        if wind_ms is None and wave_m is None:
            logger.info("좌표 (%.2f, %.2f) 예보 데이터 없음/범위 초과로 기상 판단 생략", point["lat"], point["lon"])
            continue

        severity = None
        if (wind_ms is not None and wind_ms >= HIGH_WIND_MS) or (wave_m is not None and wave_m >= HIGH_WAVE_M):
            severity = "High"
        elif (wind_ms is not None and wind_ms >= MODERATE_WIND_MS) or (wave_m is not None and wave_m >= MODERATE_WAVE_M):
            severity = "Medium"

        if severity is None:
            continue

        details = []
        if wind_ms is not None:
            details.append(f"풍속 {wind_ms:.1f}m/s")
        if wave_m is not None:
            details.append(f"파고 {wave_m:.1f}m")

        issues.append({
            "category": "기상",
            "location": f"위도 {point['lat']:.2f}, 경도 {point['lon']:.2f} 인근 해상",
            "severity": severity,
            "description": f"기상 예보 기준 {', '.join(details)}로 항해에 영향을 줄 수 있는 기상 조건이 예상됩니다.",
            "article_link": f"https://open-meteo.com/en/docs/marine-weather-api?latitude={point['lat']}&longitude={point['lon']}",
            "publisher": "Open-Meteo 기상 예보 API",
            "published_at": arrive_dt.isoformat(),
            "source_tier": "Tier 3",
            "verification_status": "verified",
        })
        logger.info(
            "기상 이슈 감지 | lat=%.2f lon=%.2f severity=%s wind_ms=%s wave_m=%s",
            point["lat"], point["lon"], severity, wind_ms, wave_m
        )

    return issues
