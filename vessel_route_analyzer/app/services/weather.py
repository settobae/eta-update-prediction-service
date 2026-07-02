import asyncio
import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

# Open-Meteo: API 키 없이 사용 가능한 기상/해양 예보 API
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

# 해상 물류 기준 임계값
HIGH_WIND_MS = 17.2      # 강풍 (약 34kt, Beaufort 8 '갈전풍')
HIGH_WAVE_M = 4.0
MODERATE_WIND_MS = 10.8  # 약 21kt, Beaufort 6 '강풍'
MODERATE_WAVE_M = 2.5

HIGH_DELAY_HOURS = 24
MODERATE_DELAY_HOURS = 12


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


async def _fetch_point_forecast(client: httpx.AsyncClient, lat: float, lon: float):
    try:
        weather_resp, marine_resp = await asyncio.gather(
            client.get(FORECAST_URL, params={
                "latitude": lat, "longitude": lon,
                "hourly": "windspeed_10m",
                "forecast_days": 10,
                "timezone": "UTC",
            }),
            client.get(MARINE_URL, params={
                "latitude": lat, "longitude": lon,
                "hourly": "wave_height",
                "forecast_days": 10,
                "timezone": "UTC",
            }),
        )
        weather_resp.raise_for_status()
        marine_resp.raise_for_status()
        return weather_resp.json(), marine_resp.json()
    except httpx.HTTPError as e:
        logger.warning("기상 API 호출 실패 | lat=%s lon=%s err=%s", lat, lon, e)
        return None


async def get_weather_issues(points_with_eta: list) -> tuple:
    """
    항로 대표 좌표별 예상 도착 시각을 기준으로 Open-Meteo 기상/파고 예보를 조회하여
    임계값을 넘는 지점을 위험 이슈로 변환한다. (뉴스 검색이 아닌 실측 기상 데이터 기반)
    반환: (issues: list[dict], total_delay_hours: int)
    """
    issues = []
    total_delay_hours = 0

    async with httpx.AsyncClient(timeout=10.0) as client:
        results = await asyncio.gather(
            *[_fetch_point_forecast(client, p["lat"], p["lon"]) for p in points_with_eta]
        )

    for point, data in zip(points_with_eta, results):
        if not data:
            continue
        weather_json, marine_json = data

        try:
            arrive_dt = datetime.fromisoformat(point["arrive_at"]).astimezone(timezone.utc)
        except ValueError:
            continue

        wind_hourly = weather_json.get("hourly", {})
        wave_hourly = marine_json.get("hourly", {})

        wind_idx = _nearest_hour_index(wind_hourly.get("time", []), arrive_dt)
        wave_idx = _nearest_hour_index(wave_hourly.get("time", []), arrive_dt)

        wind_kmh = wind_hourly.get("windspeed_10m", [])
        wave_m_list = wave_hourly.get("wave_height", [])

        wind_ms = (wind_kmh[wind_idx] / 3.6) if wind_idx is not None and wind_idx < len(wind_kmh) else None
        wave_m = wave_m_list[wave_idx] if wave_idx is not None and wave_idx < len(wave_m_list) else None

        if wind_ms is None and wave_m is None:
            logger.info("좌표 (%.2f, %.2f) 예보 범위를 벗어나 기상 판단 생략", point["lat"], point["lon"])
            continue

        severity, delay_hours = None, 0
        if (wind_ms is not None and wind_ms >= HIGH_WIND_MS) or (wave_m is not None and wave_m >= HIGH_WAVE_M):
            severity, delay_hours = "High", HIGH_DELAY_HOURS
        elif (wind_ms is not None and wind_ms >= MODERATE_WIND_MS) or (wave_m is not None and wave_m >= MODERATE_WAVE_M):
            severity, delay_hours = "Medium", MODERATE_DELAY_HOURS

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
        total_delay_hours += delay_hours
        logger.info(
            "기상 이슈 감지 | lat=%.2f lon=%.2f severity=%s wind_ms=%s wave_m=%s",
            point["lat"], point["lon"], severity, wind_ms, wave_m
        )

    return issues, total_delay_hours
