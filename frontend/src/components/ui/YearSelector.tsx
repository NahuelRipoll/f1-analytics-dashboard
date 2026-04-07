const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i)

interface YearSelectorProps {
  value: number
  onChange: (year: number) => void
}

export default function YearSelector({ value, onChange }: YearSelectorProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="text-sm px-3 py-1.5 rounded-lg outline-none"
      style={{
        backgroundColor: '#242424',
        border: '1px solid #2e2e2e',
        color: '#f0f0f0',
        cursor: 'pointer',
      }}
    >
      {YEARS.map(y => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
