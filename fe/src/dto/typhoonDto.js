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
