import { useState } from 'react'
import { Scale, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        'inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors',
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
      className="w-full flex flex-col gap-2 py-3 px-1 cursor-pointer"
      onClick={() => onRestore(entry)}
    >
      <span className="text-xs text-muted-foreground font-medium">
        {formatDate(entry.savedAt)} · {MODE_LABEL[entry.unitType]}
      </span>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.cards.map((card, i) => (
            <EntryChip key={i} card={card} isWinner={i === entry.winnerId} suffix={suffix} />
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="accent"
            size="icon"
            onClick={e => { e.stopPropagation(); onRestore(entry) }}
            aria-label="Restore entry"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button
            variant="accent"
            size="icon"
            onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
            aria-label="Delete entry"
            className="hover:bg-destructive/20 hover:text-destructive"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function HistoryPeek({ entries, onDelete, onClearAll, onRestore, hasCurrentInput }) {
  const [open, setOpen] = useState(false)
  const [pendingRestore, setPendingRestore] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function handleRestoreClick(entry) {
    if (hasCurrentInput) {
      setPendingRestore(entry)
    } else {
      onRestore(entry)
      setOpen(false)
    }
  }

  function confirmRestore() {
    if (pendingRestore) {
      onRestore(pendingRestore)
      setPendingRestore(null)
      setOpen(false)
    }
  }

  function confirmClearAll() {
    onClearAll()
    setShowClearConfirm(false)
    setOpen(false)
  }

  return (
    <>
      {/* Floating history button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open history"
        className="fixed z-40 h-11 pl-4 pr-5 rounded-full bg-white border border-[#E0E0E0] shadow-[0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.025),_0_1px_1.5px_0_rgba(0,0,0,0.0175)] flex items-center gap-2 text-foreground hover:bg-[#FAFAFA] transition-colors"
        style={{ right: '16px', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <Scale size={16} strokeWidth={2} aria-hidden="true" />
        <span className="text-sm font-medium">History</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sheet */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-auto bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.13)] flex flex-col overflow-hidden"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          inert={!open}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 py-2 shrink-0">
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
              <div className="flex-1 overflow-y-auto px-4">
                <p className="text-xs text-muted-foreground mb-2">Tap to restore · Trash to delete</p>
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
            <div className="px-4 py-4 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full h-11 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-sm font-semibold text-foreground hover:bg-[#EFEFEF] transition-colors"
              >
                Close
              </button>
            </div>
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
