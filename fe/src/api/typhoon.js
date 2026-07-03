import axios from "axios";

const TYPHOON_FORECAST_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/2/query?where=1%3D1&outFields=*&f=geojson";

const TYPHOON_FORECAST_POSITION_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson";

const TYPHOON_DANGER_CONE_URL =
  "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/4/query?where=1%3D1&outFields=*&f=geojson";

export const fetchTyphoonForecasts = async () => {
  const { data } = await axios.get(TYPHOON_FORECAST_URL);
  return data;
};

// 태풍 예보 지점별 ETA(FLDATELBL 등)를 포함하는 Forecast Position 레이어
export const fetchTyphoonForecastPositions = async () => {
  const { data } = await axios.get(TYPHOON_FORECAST_POSITION_URL);
  return data;
};

export const fetchTyphoonDangerCones = async () => {
  const { data } = await axios.get(TYPHOON_DANGER_CONE_URL);
  return data;
};
