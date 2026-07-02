import { create } from "zustand";
import {
  createCargo,
  deleteCargo,
  getAllCargos,
  getCargoSummary,
  getExistingAiSummary,
  updateCargo,
} from "../api/cargo";
import { EMPTY_AI_SUMMARY, toAiSummary } from "../dto/aiDto";

// panelMode: 'idle' | 'detail' | 'add' | 'edit'
// notification: null | { type: 'success' | 'error', message: string }
export const useCargoStore = create((set, get) => ({
  cargos: [],
  selectedCargo: null,
  panelMode: 'idle',
  loading: false,
  error: null,
  notification: null,
  formOpen: false,
  editingCargo: null,
  aiSummary: EMPTY_AI_SUMMARY,
  aiSummaryLoading: false,
  aiSummaryChecking: false,
  aiSummaryError: null,
  aiSummaryByCargoId: {},

  selectCargo: (cargo) => {
    const cached = get().aiSummaryByCargoId[cargo.id];
    set({
      selectedCargo: cargo,
      panelMode: 'detail',
      aiSummary: cached ?? EMPTY_AI_SUMMARY,
      aiSummaryError: null,
    });
    if (!cached) {
      get().fetchExistingAiSummary(cargo.id);
    }
  },
  setAiSummary: (aiSummary) => set({ aiSummary }),
  clearAiSummary: () => set({ aiSummary: EMPTY_AI_SUMMARY, aiSummaryError: null }),
  setPanelMode: (mode) => set({ panelMode: mode }),
  clearSelection: () =>
    set({ selectedCargo: null, panelMode: 'idle', aiSummary: EMPTY_AI_SUMMARY, aiSummaryError: null }),
  clearNotification: () => set({ notification: null }),
  toggleForm: () => set((s) => ({ formOpen: !s.formOpen })),
  closeForm: () => set({ formOpen: false }),
  openEditForm: (cargo) => set({ editingCargo: cargo }),
  closeEditForm: () => set({ editingCargo: null }),

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
      set({
        cargos: [...get().cargos, cargo],
        selectedCargo: cargo,
        panelMode: 'detail',
        loading: false,
        notification: { type: 'success', message: '화물이 추가되었습니다.' },
      });
      return cargo;
    } catch (error) {
      set({
        loading: false,
        notification: { type: 'error', message: error.message },
      });
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
        selectedCargo: updated,
        panelMode: 'detail',
        loading: false,
        notification: { type: 'success', message: '화물이 수정되었습니다.' },
      });
      return updated;
    } catch (error) {
      set({
        loading: false,
        notification: { type: 'error', message: error.message },
      });
      throw error;
    }
  },

  fetchExistingAiSummary: async (cargoId) => {
    set({ aiSummaryChecking: true, aiSummaryError: null });
    try {
      const response = await getExistingAiSummary(cargoId);
      if (get().selectedCargo?.id !== cargoId) return;
      if (!response) {
        set({ aiSummaryChecking: false });
        return;
      }
      const aiSummary = toAiSummary(response);
      set((s) => ({
        aiSummary,
        aiSummaryChecking: false,
        aiSummaryByCargoId: { ...s.aiSummaryByCargoId, [cargoId]: aiSummary },
      }));
    } catch (error) {
      if (get().selectedCargo?.id !== cargoId) return;
      set({ aiSummaryChecking: false, aiSummaryError: error.message });
    }
  },

  fetchAiSummary: async (cargoId) => {
    set({ aiSummaryLoading: true, aiSummaryError: null });
    try {
      const response = await getCargoSummary(cargoId);
      const aiSummary = toAiSummary(response);
      set((s) => ({
        aiSummary,
        aiSummaryLoading: false,
        aiSummaryByCargoId: { ...s.aiSummaryByCargoId, [cargoId]: aiSummary },
      }));
    } catch (error) {
      set({ aiSummaryLoading: false, aiSummaryError: error.message });
    }
  },

  removeCargo: async (cargoId) => {
    set({ loading: true, error: null });
    try {
      await deleteCargo(cargoId);
      set({
        cargos: get().cargos.filter((cargo) => cargo.id !== cargoId),
        selectedCargo: null,
        panelMode: 'idle',
        loading: false,
        notification: { type: 'success', message: '화물이 삭제되었습니다.' },
      });
    } catch (error) {
      set({
        loading: false,
        notification: { type: 'error', message: error.message },
      });
      throw error;
    }
  },
}));
