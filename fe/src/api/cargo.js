import { apiClient } from "./client";

const CARGO_BASE_URL = "/cargos/";

// dto: { projectName, from, stopover, to, items: [{ item, ea }], atd?, eta?, ata? }
export const createCargo = async (dto) => {
  const { data } = await apiClient.post(CARGO_BASE_URL, dto);
  return data;
};

export const getAllCargos = async () => {
  const { data } = await apiClient.get(CARGO_BASE_URL);
  return data;
};

export const updateCargo = async (cargoId, dto) => {
  const { data } = await apiClient.put(`${CARGO_BASE_URL}${cargoId}`, dto);
  return data;
};

export const deleteCargo = async (cargoId) => {
  const { data } = await apiClient.delete(`${CARGO_BASE_URL}${cargoId}`);
  return data;
};

export const getCargoSummary = async (cargoId) => {
  const { data } = await apiClient.get(`${CARGO_BASE_URL}summary/${cargoId}`);
  return data;
};
