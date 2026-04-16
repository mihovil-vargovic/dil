import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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

function EntryChip({ card, isWinner, suffix }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs border transition-colors',
        isWinner
          ? 'border-foreground/40 bg-foreground/5 font-semibold text-foreground'
          : 'border-border text-muted-foreground',
      ].join(' ')}
    >
      €{card.unitPrice.toFixed(2)}{suffix}{isWinner ? ' ✓' : ''}
    </span>
  )
}

function HistoryEntry({ entry, onDelete, onRestore }) {
  const suffix = SUFFIX[entry.unitType]

  return (
    <div
      className="flex flex-col gap-2 py-3 px-1 cursor-pointer"
      onClick={() => onRestore(entry)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {formatDate(entry.savedAt)} · {MODE_LABEL[entry.unitType]}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          aria-label="Delete entry"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entry.cards.map((card, i) => (
          <EntryChip key={i} card={card} isWinner={i === entry.winnerId} suffix={suffix} />
        ))}
      </div>
    </div>
  )
}

export function HistoryPeek({ entries, onDelete, onClearAll, onRestore, hasCurrentInput }) {
  const [expanded, setExpanded] = useState(false)
  const [pendingRestore, setPendingRestore] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const entry = entries[0] ?? null
  const suffix = entry ? SUFFIX[entry.unitType] : null

  function handleRestoreClick(entry) {
    if (hasCurrentInput) {
      setPendingRestore(entry)
    } else {
      onRestore(entry)
      setExpanded(false)
    }
  }

  function confirmRestore() {
    if (pendingRestore) {
      onRestore(pendingRestore)
      setPendingRestore(null)
      setExpanded(false)
    }
  }

  function confirmClearAll() {
    onClearAll()
    setShowClearConfirm(false)
    setExpanded(false)
  }

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/20 transition-opacity"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div
          className="w-full max-w-[375px] pointer-events-auto bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.13)] flex flex-col overflow-hidden"
          style={{
            height: expanded ? '100vh' : '220px',
            transition: 'height 0.3s ease',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 shrink-0 cursor-pointer"
              onClick={() => setExpanded(e => !e)}
            >
              <div className="w-10 h-1 rounded-full bg-[#E0E0E0]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 shrink-0">
              <span className="text-base font-semibold text-foreground">History</span>
              {entries.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-sm font-medium text-[oklch(0.280_0.110_95)]"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* History list */}
            {entries.length === 0 ? (
              <div className="flex-1 px-4 py-2">
                <p className="text-sm text-muted-foreground">No history yet</p>
              </div>
            ) : (
              <div className={expanded ? 'flex-1 overflow-y-auto px-4' : 'overflow-hidden px-4 max-h-[96px]'}>
                {expanded && <p className="text-xs text-muted-foreground mb-2">Tap to restore · Trash to delete</p>}
                <div className="divide-y divide-border">
                  {entries.map(e => (
                    <HistoryEntry
                      key={e.id}
                      entry={e}
                      onDelete={onDelete}
                      onRestore={handleRestoreClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {expanded ? (
              <div className="px-4 py-4 shrink-0">
                <button
                  onClick={() => setExpanded(false)}
                  className="w-full h-11 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-sm font-semibold text-foreground hover:bg-[#EFEFEF] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="px-4 pb-4 shrink-0">
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full h-11 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-sm font-semibold text-foreground hover:bg-[#EFEFEF] transition-colors"
                >
                  View all
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Restore confirmation */}
      <AlertDialog open={pendingRestore !== null} onOpenChange={open => { if (!open) setPendingRestore(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore comparison?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current entries. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingRestore(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all history?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-destructive text-white hover:bg-destructive/90">
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
