import { create } from "zustand";
import {
  createCargo,
  deleteCargo,
  getAllCargos,
  updateCargo,
} from "../api/cargo";

export const useCargoStore = create((set, get) => ({
  cargos: [],
  loading: false,
  error: null,

  fetchCargos: async () => {
    set({ loading: true, error: null });
    try {
      const cargos = await getAllCargos();
      set({ cargos, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addCargo: async (dto) => {
    set({ loading: true, error: null });
    try {
      const cargo = await createCargo(dto);
      set({ cargos: [...get().cargos, cargo], loading: false });
      return cargo;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  editCargo: async (cargoId, dto) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateCargo(cargoId, dto);
      set({
        cargos: get().cargos.map((cargo) =>
          cargo.id === cargoId ? updated : cargo
        ),
        loading: false,
      });
      return updated;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  removeCargo: async (cargoId) => {
    set({ loading: true, error: null });
    try {
      await deleteCargo(cargoId);
      set({
        cargos: get().cargos.filter((cargo) => cargo.id !== cargoId),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
