import { useEffect, useRef } from 'react'
import { maptilersdk, mapStyleUrl } from '../../api/mapClient'
import { fetchTyphoonDangerCones, fetchTyphoonForecasts } from '../../api/typhoon'
import { toTyphoonDangerCones, toTyphoonForecastPaths } from '../../dto/typhoonDto'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import './CargoMap.css'

const ROUTE_SOURCE_ID = 'cargo-route'
const ROUTE_LAYER_ID = 'cargo-route-line'

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
  const markersRef = useRef([])
  const typhoonMarkersRef = useRef([])

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new maptilersdk.Map({
      container: containerRef.current,
      style: mapStyleUrl,
      center,
      zoom,
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !route || route.length === 0) return

    const renderRoute = () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = drawRoute(map, route)
    }

    if (map.isStyleLoaded()) {
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

    if (map.isStyleLoaded()) {
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
