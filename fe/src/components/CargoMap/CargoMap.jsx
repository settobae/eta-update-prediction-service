import { useEffect, useRef } from 'react'
import { maptilersdk, mapStyleUrl } from '../../api/mapClient'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import './CargoMap.css'

function CargoMap({ from, stopover, to, center, zoom }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

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

  return (
    <div className="cargo-map">
      <div ref={containerRef} className="cargo-map__container" />
    </div>
  )
}

export default CargoMap
