import { useState, useId, useRef, useLayoutEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPeek } from '@/components/HistoryPeek'

// ─── Mode config ────────────────────────────────────────────────────────────

const MODES = {
  weight: {
    label: 'Weight',
    amountLabel: 'Amount',
    tag: 'g',
    calc: (price, amount) => price / (amount / 1000),
    resultSuffix: '/ kg',
  },
  length: {
    label: 'Length',
    amountLabel: 'Amount',
    tag: 'cm',
    calc: (price, amount) => price / (amount / 100),
    resultSuffix: '/ m',
  },
  pieces: {
    label: 'Pieces',
    amountLabel: 'Quantity',
    tag: 'pcs',
    calc: (price, amount) => price / amount,
    resultSuffix: '/ pc',
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let nextId = 1
const makeCard = () => ({ id: nextId++, price: '', amount: '', result: null, errors: {} })

function parseNum(str) {
  return Number(str.trim().replace(',', '.'))
}

function validateCard(price, amount) {
  const errors = {}
  const pn = price.trim().replace(',', '.')
  const an = amount.trim().replace(',', '.')

  if (pn === '') {
    errors.price = 'Enter a price'
  } else if (isNaN(Number(pn))) {
    errors.price = 'Numbers only'
  }

  if (an === '') {
    errors.amount = "Amount can't be zero"
  } else if (isNaN(Number(an))) {
    errors.amount = 'Numbers only'
  } else if (Number(an) === 0) {
    errors.amount = "Amount can't be zero"
  }

  return errors
}

function getBestDeal(cards) {
  const withResults = cards.filter(c => c.result !== null)
  if (withResults.length < 2) return new Set()
  const min = Math.min(...withResults.map(c => c.result))
  return new Set(withResults.filter(c => c.result === min).map(c => c.id))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InputWithTag({ label, value, onChange, tag, error, placeholder }) {
  const id = useId()

  function handleChange(e) {
    const filtered = e.target.value.replace(/[^0-9.,]/g, '')
    onChange({ ...e, target: { ...e.target, value: filtered } })
  }

  function handleClear() {
    onChange({ target: { value: '' } })
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center h-11 border border-input rounded-3xl overflow-hidden bg-white transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_oklch(0.905_0.180_95/0.35)]">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 px-3 h-full text-base text-foreground bg-transparent outline-none min-w-0 placeholder:text-[#A0AEC0]"
        />
        {value.length > 0 && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={handleClear}
            aria-label={`Clear ${label}`}
            className="flex items-center justify-center w-7 h-full text-[#A0AEC0] hover:text-foreground transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <span aria-hidden="true" className="w-11 h-full flex items-center justify-center text-sm text-[#6B7280] border-l border-input bg-[#FAFAFA] select-none shrink-0 font-medium">
          {tag}
        </span>
      </div>
      {error && (
        <span role="alert" className="text-xs text-destructive">{error}</span>
      )}
    </div>
  )
}

const MODE_ORDER = ['weight', 'length', 'pieces']
const LONG_PRESS_MS = 500

function ModePicker({ mode, open, onSelect, onCancel }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 transition-opacity"
          onClick={onCancel}
        />
      )}
      <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.13)] p-4 flex flex-col gap-2"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
            paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
          inert={!open}
        >
          {MODE_ORDER.map(key => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={[
                'w-full h-11 rounded-xl text-sm font-semibold transition-colors',
                mode === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-[#F5F5F5] text-foreground hover:bg-[#EFEFEF]',
              ].join(' ')}
            >
              {MODES[key].label}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="w-full h-11 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-sm font-semibold text-foreground hover:bg-[#EFEFEF] transition-colors mt-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

function ModeButton({ mode, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const timerRef = useRef(null)
  const longPressRef = useRef(false)

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function handlePointerDown() {
    longPressRef.current = false
    timerRef.current = setTimeout(() => {
      longPressRef.current = true
      setPickerOpen(true)
    }, LONG_PRESS_MS)
  }

  function handlePointerUp() {
    clearTimer()
    if (!longPressRef.current) {
      const idx = MODE_ORDER.indexOf(mode)
      onChange(MODE_ORDER[(idx + 1) % MODE_ORDER.length])
    }
  }

  function handleSelect(key) {
    onChange(key)
    setPickerOpen(false)
  }

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onContextMenu={e => e.preventDefault()}
        aria-label="Switch unit type — tap to cycle, hold for options"
        className="fixed z-40 h-11 px-5 rounded-full bg-white border border-[#E0E0E0] shadow-[0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.025),_0_1px_1.5px_0_rgba(0,0,0,0.0175)] flex items-center justify-center gap-2 text-foreground hover:bg-[#FAFAFA] transition-colors select-none"
        style={{ left: '16px', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', touchAction: 'manipulation' }}
      >
        <span className="text-sm font-medium">{MODES[mode].label}</span>
      </button>

      <ModePicker mode={mode} open={pickerOpen} onSelect={handleSelect} onCancel={() => setPickerOpen(false)} />
    </>
  )
}

function AnimatedDigits({ text, animKey }) {
  return (
    <span className="inline-flex">
      {text.split('').map((ch, i) => (
        <span key={`${animKey}-${i}`} className="inline-block overflow-hidden align-bottom leading-none">
          <span
            className="inline-block animate-digit-roll"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            {ch}
          </span>
        </span>
      ))}
    </span>
  )
}

function ProductCard({ card, mode, onUpdate, onRemove, onReset, showRemove, isBestDeal, isNew }) {
  const cfg = MODES[mode]
  const [resultVersion, setResultVersion] = useState(0)
  const [resetVersion, setResetVersion] = useState(0)

  function handleCalculate() {
    const errors = validateCard(card.price, card.amount)
    if (Object.keys(errors).length > 0) {
      onUpdate({ ...card, errors })
      return
    }
    const unitPrice = cfg.calc(parseNum(card.price), parseNum(card.amount))
    onUpdate({ ...card, errors: {}, result: unitPrice })
    setResultVersion(v => v + 1)
  }

  function handleReset() {
    setResetVersion(v => v + 1)
    onReset()
  }

  return (
    <div className={isNew ? 'animate-card-in' : ''}>
      <Card
        className={[
          'py-0 rounded-3xl border-0 shadow-[0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.07),_0_1px_1.5px_0_rgba(0,0,0,0.05)] transition-colors',
          isBestDeal
            ? 'border-l-4 !border-l-primary bg-primary/5 shadow-[4px_0_0_0_oklch(0.905_0.180_95),_0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.07)]'
            : '',
        ].join(' ')}
      >
        <CardContent className="p-4 flex flex-col gap-4">
          <div key={resetVersion} className="flex flex-col gap-4 animate-result-in">
            <div className="min-h-[53px] flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                {card.result !== null ? (
                  <p className="text-3xl font-bold text-left text-foreground leading-none">
                    <AnimatedDigits text={`€${card.result.toFixed(2)}`} animKey={resultVersion} />{' '}
                    <span className="text-sm font-normal text-muted-foreground">{cfg.resultSuffix}</span>
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-left text-muted-foreground/40 leading-none">
                    €0.00 <span className="text-sm font-normal">{cfg.resultSuffix}</span>
                  </p>
                )}
                {isBestDeal ? (
                  <Badge variant="default" className="text-xs shrink-0">
                    ✓ Best deal
                  </Badge>
                ) : showRemove && (
                  <button
                    onClick={onRemove}
                    aria-label="Remove product"
                    className="text-[#A0AEC0] hover:text-foreground transition-colors text-2xl leading-none w-9 h-9 flex items-center justify-center rounded shrink-0"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
              <div className="-mx-4">
                <Separator />
              </div>
            </div>

            <InputWithTag
              label="Price"
              value={card.price}
              onChange={e => onUpdate({ ...card, price: e.target.value })}
              tag="€"
              placeholder="Enter price"
              error={card.errors.price}
            />

            <InputWithTag
              label={cfg.amountLabel}
              value={card.amount}
              onChange={e => onUpdate({ ...card, amount: e.target.value })}
              tag={cfg.tag}
              placeholder={mode === 'weight' ? 'Enter weight in grams' : mode === 'length' ? 'Enter length in cm' : 'Enter number of pieces'}
              error={card.errors.amount}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button className="flex-1" onClick={handleCalculate}>
              {card.result !== null ? 'Recalculate' : 'Calculate'}
            </Button>
            <Button
              variant="accent"
              onClick={handleReset}
              aria-label="Reset card"
              className="size-11 rounded-3xl shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Wallet-style card stack ───────────────────────────────────────────────

const PEEK_OFFSET = 44

function PeekCard({ card, mode, isBestDeal, onClick }) {
  const cfg = MODES[mode]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Bring product to front"
      className={[
        'w-full text-left rounded-t-3xl rounded-b-none border-0 shadow-[0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.07),_0_1px_1.5px_0_rgba(0,0,0,0.05)] bg-white p-4 flex items-center justify-between transition-colors active:bg-[#FAFAFA]',
        isBestDeal ? 'border-l-4 !border-l-primary bg-primary/5' : '',
      ].join(' ')}
    >
      {card.result !== null ? (
        <p className="text-xl font-bold text-left text-foreground leading-none">
          €{card.result.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">{cfg.resultSuffix}</span>
        </p>
      ) : (
        <p className="text-xl font-bold text-left text-muted-foreground/40 leading-none">
          €0.00 <span className="text-xs font-normal">{cfg.resultSuffix}</span>
        </p>
      )}
      {isBestDeal && (
        <Badge variant="default" className="text-xs shrink-0">
          ✓ Best deal
        </Badge>
      )}
    </button>
  )
}

function ComparisonStack({ cards, mode, onUpdate, onRemove, onReset, bestDealIds, newCardId, onBringToFront }) {
  const frontRef = useRef(null)
  const [frontHeight, setFrontHeight] = useState(0)

  useLayoutEffect(() => {
    if (frontRef.current) {
      const h = frontRef.current.offsetHeight
      if (h !== frontHeight) setFrontHeight(h)
    }
  })

  const containerHeight = frontHeight ? (cards.length - 1) * PEEK_OFFSET + frontHeight : undefined

  return (
    <div className="relative" style={{ height: containerHeight, transition: 'height 250ms ease' }}>
      {cards.map((card, i) => {
        const isFront = i === cards.length - 1
        return (
          <div
            key={card.id}
            className="absolute inset-x-0 transition-[top] duration-300 ease-out"
            style={{ top: i * PEEK_OFFSET, zIndex: i + 1 }}
            ref={isFront ? frontRef : undefined}
          >
            {isFront ? (
              <ProductCard
                card={card}
                mode={mode}
                onUpdate={onUpdate}
                onRemove={() => onRemove(card.id)}
                onReset={() => onReset(card.id)}
                showRemove={cards.length > 1}
                isBestDeal={bestDealIds.has(card.id)}
                isNew={card.id === newCardId}
              />
            ) : (
              <PeekCard
                card={card}
                mode={mode}
                isBestDeal={bestDealIds.has(card.id)}
                onClick={() => onBringToFront(card.id)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState('weight')
  const [cardsByMode, setCardsByMode] = useState({
    weight: [makeCard()],
    length: [makeCard()],
    pieces: [makeCard()],
  })
  const [newCardId, setNewCardId] = useState(null)

  const { entries, addEntry, deleteEntry, clearAll } = useHistory()
  const cards = cardsByMode[mode]
  const bestDealIds = getBestDeal(cards)
  const hasAnyInput = cards.some(c => c.price !== '' || c.amount !== '')

  function setCards(updater) {
    setCardsByMode(prev => ({
      ...prev,
      [mode]: typeof updater === 'function' ? updater(prev[mode]) : updater,
    }))
  }

  function handleModeChange(newMode) {
    if (newMode === mode) return
    setMode(newMode)
  }

  function updateCard(updated) {
    const next = cards.map(c => c.id === updated.id ? updated : c)
    setCards(next)
    if (updated.result !== null) {
      const validCount = next.filter(c => c.result !== null).length
      if (validCount >= 2) {
        addEntry(mode, next)
      }
    }
  }

  function removeCard(id) {
    setCards(prev => prev.filter(c => c.id !== id))
  }

  function resetCard(id) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, price: '', amount: '', result: null, errors: {} } : c))
  }

  function addCard() {
    if (cards.length >= 6) return
    const card = makeCard()
    setNewCardId(card.id)
    setCards(prev => [...prev, card])
  }

  function bringToFront(id) {
    setCards(prev => {
      const target = prev.find(c => c.id === id)
      if (!target) return prev
      return [...prev.filter(c => c.id !== id), target]
    })
  }

  function handleRestore(entry) {
    const restored = entry.cards.map(c => ({
      id: nextId++,
      price: String(c.price),
      amount: String(c.amount),
      result: c.unitPrice,
      errors: {},
    }))
    setMode(entry.unitType)
    setCardsByMode(prev => ({ ...prev, [entry.unitType]: restored }))
    setNewCardId(null)
  }

  return (
    <div
      className={[
        'min-h-screen bg-white flex flex-col items-center pt-3 px-4 pb-24',
        cards.length === 1 ? 'justify-center' : '',
      ].join(' ')}
    >
      <div className="w-full max-w-[375px] flex flex-col gap-4">

        <ComparisonStack
          cards={cards}
          mode={mode}
          onUpdate={updateCard}
          onRemove={removeCard}
          onReset={resetCard}
          bestDealIds={bestDealIds}
          newCardId={newCardId}
          onBringToFront={bringToFront}
        />

        {cards.length < 6 && (
          <button
            onClick={addCard}
            className="w-full h-11 rounded-xl border border-dashed border-[#D0D0D0] text-sm text-foreground font-medium hover:border-primary hover:text-[oklch(0.280_0.110_95)] transition-colors"
          >
            + Add product for comparison
          </button>
        )}
      </div>

      <ModeButton mode={mode} onChange={handleModeChange} />

      <HistoryPeek
        entries={entries}
        onDelete={deleteEntry}
        onClearAll={clearAll}
        onRestore={handleRestore}
        hasCurrentInput={hasAnyInput}
      />
    </div>
  )
}
