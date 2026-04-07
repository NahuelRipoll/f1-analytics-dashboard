interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  accent?: boolean
}

export default function Card({ title, subtitle, children, className = '', accent }: CardProps) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{
        backgroundColor: '#1a1a1a',
        border: accent ? '1px solid #e10600' : '1px solid #2e2e2e',
      }}
    >
      {title && (
        <div className="mb-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ color: '#8a8a8a' }}>
            {title}
          </h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#8a8a8a' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
