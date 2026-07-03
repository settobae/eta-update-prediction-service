// ArcGIS Active_Hurricanes_v1 FeatureServer 응답(GeoJSON)에 대응

export const toTyphoonForecastPaths = (geojson) => {
  const longestByName = new Map()

  for (const feature of geojson.features) {
    const p = feature.properties
    const existing = longestByName.get(p.STORMNAME)
    if (existing && existing.forecastPeriod >= p.FCSTPRD) continue

    longestByName.set(p.STORMNAME, {
      name: p.STORMNAME,
      forecastPeriod: p.FCSTPRD,
      coordinates: feature.geometry.coordinates,
    })
  }

  return [...longestByName.values()]
}

// "2026-07-02 06:00 PM Thu UTC" -> Date (UTC)
export const parseTyphoonEta = (fldatelbl) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) (AM|PM) \S+ UTC$/.exec(fldatelbl ?? '')
  if (!match) return null

  const [, year, month, day, rawHour, minute, meridiem] = match
  let hour = Number(rawHour) % 12
  if (meridiem === 'PM') hour += 12

  const iso = `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${minute}:00Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

// 태풍 이름별 예보 지점(위경도 + ETA)을 시간순으로 묶어 반환.
// Forecast Track(LineString)의 좌표 순서와 대응된다.
export const toTyphoonForecastPositions = (geojson) => {
  const pointsByName = new Map()

  for (const feature of geojson.features) {
    const p = feature.properties
    const etaAt = parseTyphoonEta(p.FLDATELBL)
    if (!etaAt) continue

    const points = pointsByName.get(p.STORMNAME) ?? []
    points.push({
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
      etaAt,
    })
    pointsByName.set(p.STORMNAME, points)
  }

  return [...pointsByName.entries()].map(([name, points]) => ({
    name,
    points: points.sort((a, b) => a.etaAt.getTime() - b.etaAt.getTime()),
  }))
}

export const toTyphoonDangerCones = (geojson) => {
  const longestByName = new Map()

  for (const feature of geojson.features) {
    const p = feature.properties
    const existing = longestByName.get(p.STORMNAME)
    if (existing && existing.forecastPeriod >= p.FCSTPRD) continue

    longestByName.set(p.STORMNAME, {
      name: p.STORMNAME,
      forecastPeriod: p.FCSTPRD,
      coordinates: feature.geometry.coordinates,
    })
  }

  return [...longestByName.values()]
}
