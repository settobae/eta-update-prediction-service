import { EMPTY_CARGO_ITEM } from '../../dto/cargoDto'
import './CargoItemInput.css'

function CargoItemInput({ items, onChange }) {
  const handleChange = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: field === 'ea' ? Number(value) : value } : item
    )
    onChange(updated)
  }

  const handleAdd = () => onChange([...items, { ...EMPTY_CARGO_ITEM }])

  const handleRemove = (index) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="cargo-item-input">
      <div className="cargo-item-input__header">
        <span>품목</span>
        <span>수량</span>
      </div>

      {items.map((item, index) => (
        <div key={index} className="cargo-item-input__row">
          <input
            type="text"
            placeholder="품목명"
            value={item.item}
            onChange={(e) => handleChange(index, 'item', e.target.value)}
          />
          <input
            type="number"
            min={1}
            value={item.ea}
            onChange={(e) => handleChange(index, 'ea', e.target.value)}
          />
          <button
            type="button"
            className="btn-remove"
            onClick={() => handleRemove(index)}
            disabled={items.length === 1}
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" className="btn-add-item" onClick={handleAdd}>
        + 품목 추가
      </button>
    </div>
  )
}

export default CargoItemInput
