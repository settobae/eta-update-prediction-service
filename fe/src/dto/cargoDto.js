export const EMPTY_CARGO_ITEM = {
  item: '',
  ea: 1,
}

export const EMPTY_CARGO_FORM = {
  projectName: '',
  from: '',
  stopover: '',
  to: '',
  items: [{ ...EMPTY_CARGO_ITEM }],
  atd: '',
  eta: '',
  ata: '',
}

export const toCargoPayload = (form) => ({
  projectName: form.projectName,
  from: form.from,
  stopover: form.stopover || null,
  to: form.to,
  items: form.items,
  atd: form.atd || null,
  eta: form.eta || null,
  ata: form.ata || null,
})
