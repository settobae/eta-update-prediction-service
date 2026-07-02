import { useState } from 'react'
import { useCargoStore } from '../../store/useCargoStore'
import { EMPTY_CARGO_FORM, toCargoPayload } from '../../dto/cargoDto'
import CargoItemInput from './CargoItemInput'
import './CargoForm.css'

const createEmptyForm = () => ({ ...EMPTY_CARGO_FORM, items: [{ item: '', ea: 1 }] })

const combineDateTime = (date, time) => (date ? `${date}T${time || '00:00'}` : '')

function DateTimeField({ label, value, onChange }) {
  const [date = '', time = ''] = value ? value.split('T') : []

  return (
    <div className="cargo-form__date-field">
      <span>{label}</span>
      <div className="cargo-form__datetime">
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(combineDateTime(e.target.value, time))}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => onChange(combineDateTime(date, e.target.value))}
        />
      </div>
    </div>
  )
}

function CargoForm() {
  const { addCargo, closeForm } = useCargoStore()
  const [form, setForm] = useState(createEmptyForm)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleCancel = () => {
    setForm(createEmptyForm())
    closeForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addCargo(toCargoPayload(form))
      setForm(createEmptyForm())
      closeForm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="cargo-form" onSubmit={handleSubmit}>
      <div className="cargo-form__section cargo-form__section--project">
        <label>프로젝트명</label>
        <input
          type="text"
          value={form.projectName}
          onChange={(e) => handleChange('projectName', e.target.value)}
          required
        />
      </div>

      <div className="cargo-form__section cargo-form__section--route">
        <label>경로</label>
        <div className="cargo-form__route">
          <input
            type="text"
            placeholder="출발지"
            value={form.from}
            onChange={(e) => handleChange('from', e.target.value)}
            required
          />
          <span className="cargo-form__arrow">→</span>
          <input
            type="text"
            placeholder="경유지 (선택)"
            value={form.stopover}
            onChange={(e) => handleChange('stopover', e.target.value)}
          />
          <span className="cargo-form__arrow">→</span>
          <input
            type="text"
            placeholder="도착지"
            value={form.to}
            onChange={(e) => handleChange('to', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="cargo-form__section cargo-form__section--items">
        <label>품목</label>
        <CargoItemInput
          items={form.items}
          onChange={(items) => handleChange('items', items)}
        />
      </div>

      <div className="cargo-form__section cargo-form__section--dates">
        <label>일정</label>
        <div className="cargo-form__dates">
          <DateTimeField label="ATD" value={form.atd} onChange={(v) => handleChange('atd', v)} />
          <DateTimeField label="ETA" value={form.eta} onChange={(v) => handleChange('eta', v)} />
          <DateTimeField label="ATA (선택)" value={form.ata} onChange={(v) => handleChange('ata', v)} />
        </div>
      </div>

      <div className="cargo-form__actions">
        <button type="button" className="btn-cancel" onClick={handleCancel}>
          취소
        </button>
        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}

export default CargoForm
