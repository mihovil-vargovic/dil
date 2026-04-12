import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  const [swiped, setSwiped] = useState(false)

  return (
    <div className="relative overflow-hidden">
      {/* Delete reveal */}
      <div
        className={[
          'absolute right-0 top-0 bottom-0 flex items-center transition-all duration-200',
          swiped ? 'w-20 opacity-100' : 'w-0 opacity-0',
        ].join(' ')}
      >
        <button
          onClick={() => onDelete(entry.id)}
          className="w-full h-full bg-destructive text-white text-xs font-medium flex items-center justify-center"
        >
          Delete
        </button>
      </div>

      {/* Entry row */}
      <div
        className={[
          'flex flex-col gap-2 py-3 px-1 cursor-pointer transition-transform duration-200',
          swiped ? '-translate-x-20' : 'translate-x-0',
        ].join(' ')}
        onClick={() => { if (!swiped) onRestore(entry) }}
        onContextMenu={e => { e.preventDefault(); setSwiped(s => !s) }}
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
    </div>
  )
}

export function HistoryDrawer({ open, onOpenChange, entries, onDelete, onClearAll, onRestore, hasCurrentInput }) {
  const [pendingRestore, setPendingRestore] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function handleRestoreClick(entry) {
    if (hasCurrentInput) {
      setPendingRestore(entry)
    } else {
      onRestore(entry)
      onOpenChange(false)
    }
  }

  function confirmRestore() {
    if (pendingRestore) {
      onRestore(pendingRestore)
      setPendingRestore(null)
      onOpenChange(false)
    }
  }

  function confirmClearAll() {
    onClearAll()
    setShowClearConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[75vh] flex flex-col rounded-t-2xl px-4 pt-0">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          <SheetHeader className="flex flex-row items-center justify-between py-3 shrink-0">
            <SheetTitle className="text-base font-semibold">History</SheetTitle>
            {entries.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-[oklch(0.280_0.110_95)] font-medium"
              >
                Clear all
              </button>
            )}
          </SheetHeader>

          {entries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No comparisons yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto -mx-4 px-4">
              <p className="text-xs text-muted-foreground mb-3">Tap to restore · Trash to delete</p>
              <div className="divide-y divide-border">
                {entries.map(entry => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onDelete={onDelete}
                    onRestore={handleRestoreClick}
                  />
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
            <AlertDialogDescription>
              This can't be undone.
            </AlertDialogDescription>
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
