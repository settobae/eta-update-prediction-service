import * as maptilersdk from '@maptiler/sdk'

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY

export const mapStyleUrl = `https://api.maptiler.com/maps/${import.meta.env.VITE_MAPTILER_MAP_ID}/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`

export { maptilersdk }
