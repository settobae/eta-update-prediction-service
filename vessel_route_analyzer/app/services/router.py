import logging
import searoute as sr
from app.services.codex_runner import run_codex_prompt

logger = logging.getLogger(__name__)

# 주요 항구 캐시 (API 호출 횟수 감소 및 Fallback용)
PORT_COORDINATES_CACHE = {
    "busan": [129.07, 35.17],
    "rotterdam": [4.47, 51.92],
    "singapore": [103.85, 1.29],
    "shanghai": [121.47, 31.23],
    "suez": [32.55, 29.97],
    "los angeles": [-118.24, 33.74],
    "la": [-118.24, 33.74],
    "panama": [-79.91, 9.11],
    "new york": [-74.00, 40.71],
    "gibraltar": [-5.35, 36.14],
    "hamburg": [9.99, 53.55],
    "tokyo": [139.69, 35.67],
    "yokohama": [139.64, 35.44],
    "port said": [32.30, 31.26],
    "manila": [120.98, 14.59]
}

def _build_coordinate_prompt(name: str) -> str:
    return (
        f"항구 또는 도시 명칭 '{name}'의 대표적인 항구 중심부 위경도 좌표를 알려주세요.\n"
        f"반드시 아래 JSON 형식으로만 응답해야 합니다. 다른 설명 텍스트는 일체 생략하세요.\n"
        f"JSON 형식:\n"
        f"{{\n"
        f"  \"longitude\": 경도값(float),\n"
        f"  \"latitude\": 위도값(float)\n"
        f"}}"
    )

async def get_coordinates_from_name(name: str) -> list:
    """
    항구 또는 도시 명칭을 바탕으로 위경도 [경도(lon), 위도(lat)]를 반환합니다.
    캐시에 없으면 로컬 Codex CLI를 사용해 좌표를 추론합니다.
    """
    clean_name = name.strip().lower()

    # 1. 캐시 조회 (완전 일치 우선)
    for port, coords in PORT_COORDINATES_CACHE.items():
        if clean_name == port:
            return coords

    # 2. 캐시 조회 (부분 일치 - 단, 'la' 오매핑 방지를 위해 캐시 키가 3글자 이상인 경우만 허용)
    for port, coords in PORT_COORDINATES_CACHE.items():
        if len(port) >= 3 and port in clean_name:
            return coords

    # 3. 캐시에 없으면 로컬 Codex CLI로 조회
    logger.info("'%s' 좌표 캐시 미스, Codex CLI로 추론 요청", name)
    try:
        data = await run_codex_prompt(_build_coordinate_prompt(name), timeout_seconds=60.0)
        coords = [float(data["longitude"]), float(data["latitude"])]
        logger.info("'%s' 좌표 추론 성공 | lon=%s lat=%s", name, coords[0], coords[1])
        return coords
    except Exception as e:
        logger.error("'%s' 좌표 추론 실패 | %s", name, e)
        raise RuntimeError(f"좌표 추론 실패: '{name}'의 좌표를 확인할 수 없습니다. 상세: {e}") from e

def interpolate_coords(coords: list, target_count: int = 10) -> list:
    """
    위경도 좌표 리스트를 받아 수학적 선형 보간을 수행하여 정확히 target_count(10)개의 좌표 리스트로 축약합니다.
    """
    n = len(coords)
    if n == 0:
        return [[0.0, 0.0]] * target_count
    if n == 1:
        return [coords[0]] * target_count
        
    sampled = []
    for i in range(target_count):
        float_idx = i * (n - 1) / (target_count - 1)
        lower_idx = int(float_idx)
        upper_idx = min(lower_idx + 1, n - 1)
        weight = float_idx - lower_idx
        
        lon = coords[lower_idx][0] * (1 - weight) + coords[upper_idx][0] * weight
        lat = coords[lower_idx][1] * (1 - weight) + coords[upper_idx][1] * weight
        sampled.append([lon, lat])
        
    return sampled

async def calculate_optimal_route(departure: str, destination: str, stopover: str = None) -> list:
    """
    출발지, 단일 경유지(stopover, 선택), 도착지를 엮어 해상 최적 항로를 계산하고,
    전체 항로 좌표를 취합하여 최종 10개의 좌표 포인트로 보간 및 축약합니다.
    """
    # 1. 경로 순서 설정 (출발지 -> 경유지(존재 시) -> 도착지)
    waypoints = [stopover] if stopover and stopover.strip() else []
    locations = [departure] + waypoints + [destination]

    # 2. 모든 지점의 좌표 변환
    coords_list = []
    for loc in locations:
        coords = await get_coordinates_from_name(loc)
        coords_list.append(coords)
        
    # 3. 세그먼트별 해상 항로 계산 및 병합
    full_route_coordinates = []
    for i in range(len(coords_list) - 1):
        segment_origin = coords_list[i]
        segment_dest = coords_list[i+1]
        
        # 세그먼트 계산 진행 로그
        logger.info(
            "세그먼트 %d 경로 계산 중 | %s %s -> %s %s",
            i + 1, locations[i], segment_origin, locations[i + 1], segment_dest
        )

        segment_route = sr.searoute(segment_origin, segment_dest)
        segment_coords = segment_route['geometry']['coordinates']

        logger.info("세그먼트 %d 경로 계산 성공", i + 1)
        
        if full_route_coordinates and segment_coords:
            full_route_coordinates.extend(segment_coords[1:])
        else:
            full_route_coordinates.extend(segment_coords)
            
    # 4. 전체 항로를 정확히 10개 대표 좌표로 축약
    logger.info("전체 %d개 상세 경로 좌표를 10개 대표 포인트로 보간 중...", len(full_route_coordinates))
    simplified_route = interpolate_coords(full_route_coordinates, target_count=10)
    logger.info("10개 대표 좌표 보간 완료")

    return simplified_route
