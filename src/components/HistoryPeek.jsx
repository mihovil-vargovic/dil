const SUFFIX = { weight: '/kg', length: '/m', pieces: '/pc' }
const MODE_LABEL = { weight: 'Weight', length: 'Length', pieces: 'Pieces' }

function formatDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart - 86400000)

  if (date >= todayStart) {
    return `Today ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  if (date >= yesterdayStart) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function HistoryPeek({ entry, onSeeAll }) {
  const suffix = entry ? SUFFIX[entry.unitType] : null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div
        className="w-full max-w-[375px] bg-white rounded-t-2xl shadow-[0_-2px_16px_rgba(0,0,0,0.10)] pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={onSeeAll}>
          <div className="w-10 h-1 rounded-full bg-[#E0E0E0]" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">History</span>
            <button onClick={onSeeAll} className="text-sm font-medium text-[oklch(0.280_0.110_95)]">
              See all
            </button>
          </div>

          {entry ? (
            <div className="bg-[#FAFAFA] rounded-xl p-3 border border-[#E0E0E0]">
              <p className="text-xs text-muted-foreground mb-2">
                {formatDate(entry.savedAt)} · {MODE_LABEL[entry.unitType]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.cards.map((card, i) => (
                  <span
                    key={i}
                    className={[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs border',
                      i === entry.winnerId
                        ? 'border-foreground/40 bg-foreground/5 font-semibold text-foreground'
                        : 'border-border text-muted-foreground',
                    ].join(' ')}
                  >
                    €{card.unitPrice.toFixed(2)}{suffix}{i === entry.winnerId ? ' ✓' : ''}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No comparisons yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
