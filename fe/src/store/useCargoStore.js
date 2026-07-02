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
  aiSummaryLoadingByCargoId: {},
  aiSummaryCheckingByCargoId: {},
  aiSummaryCheckedCargoIds: {},
  aiSummaryErrorByCargoId: {},

  selectCargo: (cargo) => {
    set((s) => ({
      selectedCargo: cargo,
      panelMode: 'detail',
      aiSummary: s.aiSummaryByCargoId[cargo.id] ?? EMPTY_AI_SUMMARY,
      aiSummaryLoading: Boolean(s.aiSummaryLoadingByCargoId[cargo.id]),
      aiSummaryChecking: Boolean(s.aiSummaryCheckingByCargoId[cargo.id]),
      aiSummaryError: s.aiSummaryErrorByCargoId[cargo.id] ?? null,
    }));
    if (!get().aiSummaryCheckedCargoIds[cargo.id]) {
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
    set((s) => ({
      aiSummaryCheckingByCargoId: { ...s.aiSummaryCheckingByCargoId, [cargoId]: true },
      ...(s.selectedCargo?.id === cargoId ? { aiSummaryChecking: true, aiSummaryError: null } : null),
    }));
    try {
      const response = await getExistingAiSummary(cargoId);
      const aiSummary = response ? toAiSummary(response) : null;
      set((s) => ({
        aiSummaryCheckingByCargoId: { ...s.aiSummaryCheckingByCargoId, [cargoId]: false },
        aiSummaryCheckedCargoIds: { ...s.aiSummaryCheckedCargoIds, [cargoId]: true },
        ...(aiSummary
          ? { aiSummaryByCargoId: { ...s.aiSummaryByCargoId, [cargoId]: aiSummary } }
          : null),
        ...(s.selectedCargo?.id === cargoId
          ? { aiSummaryChecking: false, ...(aiSummary ? { aiSummary } : null) }
          : null),
      }));
    } catch (error) {
      set((s) => ({
        aiSummaryCheckingByCargoId: { ...s.aiSummaryCheckingByCargoId, [cargoId]: false },
        ...(s.selectedCargo?.id === cargoId
          ? { aiSummaryChecking: false, aiSummaryError: error.message }
          : null),
      }));
    }
  },

  fetchAiSummary: async (cargoId) => {
    set((s) => ({
      aiSummaryLoadingByCargoId: { ...s.aiSummaryLoadingByCargoId, [cargoId]: true },
      aiSummaryErrorByCargoId: { ...s.aiSummaryErrorByCargoId, [cargoId]: null },
      ...(s.selectedCargo?.id === cargoId
        ? { aiSummaryLoading: true, aiSummaryError: null }
        : null),
    }));
    try {
      const response = await getCargoSummary(cargoId);
      const aiSummary = toAiSummary(response);
      set((s) => ({
        aiSummaryByCargoId: { ...s.aiSummaryByCargoId, [cargoId]: aiSummary },
        aiSummaryLoadingByCargoId: { ...s.aiSummaryLoadingByCargoId, [cargoId]: false },
        aiSummaryCheckedCargoIds: { ...s.aiSummaryCheckedCargoIds, [cargoId]: true },
        ...(s.selectedCargo?.id === cargoId
          ? { aiSummary, aiSummaryLoading: false }
          : null),
      }));
    } catch (error) {
      set((s) => ({
        aiSummaryLoadingByCargoId: { ...s.aiSummaryLoadingByCargoId, [cargoId]: false },
        aiSummaryErrorByCargoId: { ...s.aiSummaryErrorByCargoId, [cargoId]: error.message },
        ...(s.selectedCargo?.id === cargoId
          ? { aiSummaryLoading: false, aiSummaryError: error.message }
          : null),
      }));
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
