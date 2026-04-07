export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="rounded-full border-2 animate-spin"
        style={{
          width: size,
          height: size,
          borderColor: '#2e2e2e',
          borderTopColor: '#e10600',
        }}
      />
    </div>
  )
}
