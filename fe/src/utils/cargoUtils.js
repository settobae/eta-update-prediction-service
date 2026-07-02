// 'done' | 'transit' | 'delayed' | 'pending'
export const getCargoStatus = (cargo) => {
  if (cargo.ata) return 'done'
  if (cargo.eta && new Date(cargo.eta) < new Date()) return 'delayed'
  if (cargo.atd) return 'transit'
  return 'pending'
}

export const STATUS_LABEL = {
  done:    '운송 완료',
  transit: '운송 중',
  delayed: '지연',
  pending: '출발 전',
}

export const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
