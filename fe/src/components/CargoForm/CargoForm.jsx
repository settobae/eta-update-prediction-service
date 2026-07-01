import { useState } from 'react'
import { useCargoStore } from '../../store/useCargoStore'
import { EMPTY_CARGO_FORM, toCargoPayload } from '../../dto/cargoDto'
import CargoItemInput from './CargoItemInput'
import './CargoForm.css'

function CargoForm() {
  const { addCargo, setPanelMode } = useCargoStore()
  const [form, setForm] = useState({ ...EMPTY_CARGO_FORM, items: [{ item: '', ea: 1 }] })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addCargo(toCargoPayload(form))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="cargo-form" onSubmit={handleSubmit}>
      <h2 className="cargo-form__title">화물 추가</h2>

      <div className="cargo-form__section">
        <label>프로젝트명</label>
        <input
          type="text"
          value={form.projectName}
          onChange={(e) => handleChange('projectName', e.target.value)}
          required
        />
      </div>

      <div className="cargo-form__section">
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

      <div className="cargo-form__section">
        <label>품목</label>
        <CargoItemInput
          items={form.items}
          onChange={(items) => handleChange('items', items)}
        />
      </div>

      <div className="cargo-form__section">
        <label>일정</label>
        <div className="cargo-form__dates">
          <div className="cargo-form__date-field">
            <span>ATD</span>
            <input
              type="date"
              value={form.atd}
              onChange={(e) => handleChange('atd', e.target.value)}
            />
          </div>
          <div className="cargo-form__date-field">
            <span>ETA</span>
            <input
              type="date"
              value={form.eta}
              onChange={(e) => handleChange('eta', e.target.value)}
            />
          </div>
          <div className="cargo-form__date-field">
            <span>ATA (선택)</span>
            <input
              type="date"
              value={form.ata}
              onChange={(e) => handleChange('ata', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="cargo-form__actions">
        <button type="button" className="btn-cancel" onClick={() => setPanelMode('idle')}>
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
