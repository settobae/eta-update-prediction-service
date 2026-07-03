import { useEffect, useRef } from 'react'
import { maptilersdk, mapStyleUrl } from '../../api/mapClient'
import { fetchTyphoonDangerCones, fetchTyphoonForecasts } from '../../api/typhoon'
import { toTyphoonDangerCones, toTyphoonForecastPaths } from '../../dto/typhoonDto'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import './CargoMap.css'

const ROUTE_SOURCE_ID = 'cargo-route'
const ROUTE_LAYER_ID = 'cargo-route-line'
const SHIP_POSITION_REFRESH_INTERVAL_MS = 60 * 60 * 1000

const MARKER_COLOR_START = '#2e7d32'
const MARKER_COLOR_END = '#c62828'
const ROUTE_LINE_COLOR = '#1565c0'

const TYPHOON_FORECAST_SOURCE_ID = 'typhoon-forecast'
const TYPHOON_FORECAST_GLOW_LAYER_ID = 'typhoon-forecast-glow'
const TYPHOON_FORECAST_LAYER_ID = 'typhoon-forecast-line'
const TYPHOON_FORECAST_LINE_COLOR = '#e65100'

const TYPHOON_CONE_SOURCE_ID = 'typhoon-danger-cone'
const TYPHOON_CONE_FILL_LAYER_ID = 'typhoon-danger-cone-fill'
const TYPHOON_CONE_OUTLINE_LAYER_ID = 'typhoon-danger-cone-outline'
const TYPHOON_CONE_COLOR = '#e65100'

function toRouteGeoJson(route) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route.map((point) => [point.lon, point.lat]),
    },
  }
}

function addMarker(map, point, color) {
  return new maptilersdk.Marker({ color })
    .setLngLat([point.lon, point.lat])
    .setPopup(new maptilersdk.Popup({ offset: 16 }).setText(point.arrive_at))
    .addTo(map)
}

function drawRoute(map, route) {
  const geojson = toRouteGeoJson(route)
  const source = map.getSource(ROUTE_SOURCE_ID)

  if (source) {
    source.setData(geojson)
  } else {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson })
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTE_LINE_COLOR, 'line-width': 3 },
    })
  }

  const start = route[0]
  const end = route[route.length - 1]

  if (start === end) return [addMarker(map, start, MARKER_COLOR_START)]

  return [
    addMarker(map, start, MARKER_COLOR_START),
    addMarker(map, end, MARKER_COLOR_END),
  ]
}

function findCurrentPositionPoint(route, now) {
  if (!route || route.length === 0) return null

  const nowTime = now.getTime()
  const firstTime = new Date(route[0].arrive_at).getTime()
  const lastTime = new Date(route[route.length - 1].arrive_at).getTime()

  if (nowTime <= firstTime) return route[0]
  if (nowTime >= lastTime) return route[route.length - 1]

  for (let i = 0; i < route.length - 1; i++) {
    const t1 = new Date(route[i].arrive_at).getTime()
    const t2 = new Date(route[i + 1].arrive_at).getTime()

    if (nowTime >= t1 && nowTime <= t2) {
      return Math.abs(nowTime - t1) <= Math.abs(t2 - nowTime) ? route[i] : route[i + 1]
    }
  }

  return route[route.length - 1]
}

function createShipMarkerElement() {
  const el = document.createElement('div')
  el.className = 'cargo-map__ship-marker'
  el.textContent = '🚢'
  return el
}

function createTyphoonMarkerElement(name) {
  const el = document.createElement('div')
  el.className = 'cargo-map__typhoon-marker'

  const icon = document.createElement('div')
  icon.className = 'cargo-map__typhoon-icon'
  icon.textContent = '🌀'

  const label = document.createElement('div')
  label.className = 'cargo-map__typhoon-name'
  label.textContent = name

  el.append(icon, label)
  return el
}

function drawTyphoonPositions(map, paths) {
  return paths.map((path) =>
    new maptilersdk.Marker({ element: createTyphoonMarkerElement(path.name) })
      .setLngLat(path.coordinates[0])
      .addTo(map)
  )
}

function bearingDegrees([lon1, lat1], [lon2, lat2]) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const toDeg = (rad) => (rad * 180) / Math.PI
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const deltaLambda = toRad(lon2 - lon1)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function createForecastArrowElement() {
  const el = document.createElement('div')
  el.className = 'cargo-map__typhoon-arrow'
  return el
}

function drawTyphoonForecastArrows(map, paths) {
  return paths
    .filter((path) => path.coordinates.length >= 2)
    .map((path) => {
      const coords = path.coordinates
      const bearing = bearingDegrees(coords[coords.length - 2], coords[coords.length - 1])

      return new maptilersdk.Marker({
        element: createForecastArrowElement(),
        rotation: bearing,
        rotationAlignment: 'map',
      })
        .setLngLat(coords[coords.length - 1])
        .addTo(map)
    })
}

function drawTyphoonForecastPaths(map, paths) {
  const geojson = {
    type: 'FeatureCollection',
    features: paths.map((path) => ({
      type: 'Feature',
      properties: { name: path.name },
      geometry: { type: 'LineString', coordinates: path.coordinates },
    })),
  }

  const source = map.getSource(TYPHOON_FORECAST_SOURCE_ID)
  if (source) {
    source.setData(geojson)
    return
  }

  map.addSource(TYPHOON_FORECAST_SOURCE_ID, { type: 'geojson', data: geojson })
  map.addLayer({
    id: TYPHOON_FORECAST_GLOW_LAYER_ID,
    type: 'line',
    source: TYPHOON_FORECAST_SOURCE_ID,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': TYPHOON_FORECAST_LINE_COLOR,
      'line-width': 8,
      'line-opacity': 0.25,
      'line-blur': 3,
    },
  })
  map.addLayer({
    id: TYPHOON_FORECAST_LAYER_ID,
    type: 'line',
    source: TYPHOON_FORECAST_SOURCE_ID,
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': TYPHOON_FORECAST_LINE_COLOR,
      'line-width': 2.5,
      'line-dasharray': [2, 2],
    },
  })
}

function drawTyphoonDangerCones(map, cones) {
  const geojson = {
    type: 'FeatureCollection',
    features: cones.map((cone) => ({
      type: 'Feature',
      properties: { name: cone.name },
      geometry: { type: 'Polygon', coordinates: cone.coordinates },
    })),
  }

  const source = map.getSource(TYPHOON_CONE_SOURCE_ID)
  if (source) {
    source.setData(geojson)
    return
  }

  map.addSource(TYPHOON_CONE_SOURCE_ID, { type: 'geojson', data: geojson })
  map.addLayer({
    id: TYPHOON_CONE_FILL_LAYER_ID,
    type: 'fill',
    source: TYPHOON_CONE_SOURCE_ID,
    paint: {
      'fill-color': TYPHOON_CONE_COLOR,
      'fill-opacity': 0.12,
    },
  })
  map.addLayer({
    id: TYPHOON_CONE_OUTLINE_LAYER_ID,
    type: 'line',
    source: TYPHOON_CONE_SOURCE_ID,
    paint: {
      'line-color': TYPHOON_CONE_COLOR,
      'line-width': 1,
      'line-opacity': 0.4,
    },
  })
}

function CargoMap({ cargoId, from, stopover, to, center, zoom, route }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const mapLoadedRef = useRef(false)
  const markersRef = useRef([])
  const typhoonMarkersRef = useRef([])
  const shipMarkerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: mapStyleUrl,
      center,
      zoom,
    })
    mapRef.current = map
    map.once('load', () => {
      mapLoadedRef.current = true
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      mapLoadedRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const clearRoute = () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      const source = map.getSource(ROUTE_SOURCE_ID)
      if (source) {
        source.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } })
      }
    }

    const renderRoute = () => {
      if (!route || route.length === 0) {
        clearRoute()
        return
      }
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = drawRoute(map, route)
    }

    if (mapLoadedRef.current) {
      renderRoute()
    } else {
      map.once('load', renderRoute)
    }

    return () => {
      map.off('load', renderRoute)
    }
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const renderShipMarker = () => {
      try {
        shipMarkerRef.current?.remove()
        shipMarkerRef.current = null

        const point = findCurrentPositionPoint(route, new Date())
        if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return

        shipMarkerRef.current = new maptilersdk.Marker({ element: createShipMarkerElement() })
          .setLngLat([point.lon, point.lat])
          .addTo(map)
      } catch (error) {
        console.error('현재 위치 아이콘을 표시하지 못했습니다.', error)
      }
    }

    if (mapLoadedRef.current) {
      renderShipMarker()
    } else {
      map.once('load', renderShipMarker)
    }

    const intervalId = setInterval(() => {
      if (mapLoadedRef.current) renderShipMarker()
    }, SHIP_POSITION_REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
      map.off('load', renderShipMarker)
      shipMarkerRef.current?.remove()
      shipMarkerRef.current = null
    }
  }, [route])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let cancelled = false

    const renderTyphoons = async () => {
      try {
        const [forecasts, dangerCones] = await Promise.all([
          fetchTyphoonForecasts(),
          fetchTyphoonDangerCones(),
        ])
        if (cancelled) return

        const paths = toTyphoonForecastPaths(forecasts)

        typhoonMarkersRef.current.forEach((marker) => marker.remove())
        typhoonMarkersRef.current = [
          ...drawTyphoonPositions(map, paths),
          ...drawTyphoonForecastArrows(map, paths),
        ]
        drawTyphoonDangerCones(map, toTyphoonDangerCones(dangerCones))
        drawTyphoonForecastPaths(map, paths)
      } catch (error) {
        console.error('태풍 정보를 불러오지 못했습니다.', error)
      }
    }

    if (mapLoadedRef.current) {
      renderTyphoons()
    } else {
      map.once('load', renderTyphoons)
    }

    return () => {
      cancelled = true
      map.off('load', renderTyphoons)
    }
  }, [cargoId])

  return (
    <div className="cargo-map">
      <div ref={containerRef} className="cargo-map__container" />
    </div>
  )
}

export default CargoMap
