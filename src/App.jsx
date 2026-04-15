import { useState, useId } from 'react'
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
      <div className="flex items-center h-11 border border-input rounded-[6px] overflow-hidden bg-white transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_oklch(0.905_0.180_95/0.35)]">
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

function UnitSwitcher({ mode, onChange }) {
  return (
    <div role="group" aria-label="Unit type" className="flex items-center bg-[#F0F0F0] rounded-lg p-1 gap-0.5">
      {Object.entries(MODES).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={mode === key}
          className={[
            'flex-1 text-sm font-medium py-1.5 rounded-md transition-all',
            mode === key
              ? 'bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'text-[#6B7280] hover:text-foreground',
          ].join(' ')}
        >
          {cfg.label}
        </button>
      ))}
    </div>
  )
}

function ProductCard({ card, mode, onUpdate, onRemove, onReset, showRemove, isBestDeal, isNew }) {
  const cfg = MODES[mode]
  const hasInput = card.price !== '' || card.amount !== '' || card.result !== null

  function handleCalculate() {
    const errors = validateCard(card.price, card.amount)
    if (Object.keys(errors).length > 0) {
      onUpdate({ ...card, errors })
      return
    }
    const unitPrice = cfg.calc(parseNum(card.price), parseNum(card.amount))
    onUpdate({ ...card, errors: {}, result: unitPrice })
  }

  return (
    <div className={isNew ? 'animate-card-in' : ''}>
      <Card
        className={[
          'py-0 rounded-xl border-0 shadow-[0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.07),_0_1px_1.5px_0_rgba(0,0,0,0.05)] transition-colors',
          isBestDeal
            ? 'border-l-4 !border-l-primary bg-primary/5 shadow-[4px_0_0_0_oklch(0.905_0.180_95),_0_0_0_1px_#E0E0E0,_0_2px_4px_0_rgba(0,0,0,0.07)]'
            : '',
        ].join(' ')}
      >
        <CardContent className="p-4 flex flex-col gap-4">
          {(isBestDeal || showRemove || hasInput) && (
            <div className="flex items-center justify-between -mb-1">
              <div>
                {isBestDeal && (
                  <Badge variant="default" className="text-xs">
                    ✓ Best deal
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasInput && (
                  <button
                    onClick={onReset}
                    aria-label="Reset card"
                    className="text-[#A0AEC0] hover:text-foreground transition-colors w-6 h-6 flex items-center justify-center rounded"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                )}
                {showRemove && (
                  <button
                    onClick={onRemove}
                    aria-label="Remove product"
                    className="text-[#A0AEC0] hover:text-foreground transition-colors text-lg leading-none w-6 h-6 flex items-center justify-center rounded"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                )}
              </div>
            </div>
          )}

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

          <Button className="w-full" onClick={handleCalculate}>
            {card.result !== null ? 'Recalculate' : 'Calculate'}
          </Button>

          {card.result !== null && (
            <>
              <Separator />
              <p className="text-2xl font-bold text-center text-foreground animate-result-in">
                €{card.result.toFixed(2)}{' '}
                <span className="font-normal text-muted-foreground">{cfg.resultSuffix}</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>
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
  const [hasCalculated, setHasCalculated] = useState(false)
  const [historyOpenTrigger, setHistoryOpenTrigger] = useState(0)

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
        setHasCalculated(true)
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

  function clearAllCards() {
    setCards(prev => prev.map(c => ({ ...c, price: '', amount: '', result: null, errors: {} })))
  }

  function addCard() {
    if (cards.length >= 6) return
    const card = makeCard()
    setNewCardId(card.id)
    setCards(prev => [...prev, card])
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
    <div className="min-h-screen bg-white flex flex-col items-center pt-10 px-4 pb-48">
      <div className="w-full max-w-[375px] flex flex-col gap-4">

        {/* Navbar */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Cifrijaner</h1>
          <div className="flex items-center gap-3">
            {hasAnyInput && (
              <button
                onClick={clearAllCards}
                className="text-sm text-[#6B7280] hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => { setHasCalculated(true); setHistoryOpenTrigger(n => n + 1) }}
              aria-label="View history"
              className="text-[#6B7280] hover:text-foreground transition-colors w-8 h-8 flex items-center justify-center rounded"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          </div>
        </div>

        <UnitSwitcher mode={mode} onChange={handleModeChange} />

        {cards.map(card => (
          <ProductCard
            key={card.id}
            card={card}
            mode={mode}
            onUpdate={updateCard}
            onRemove={() => removeCard(card.id)}
            onReset={() => resetCard(card.id)}
            showRemove={cards.length > 1}
            isBestDeal={bestDealIds.has(card.id)}
            isNew={card.id === newCardId}
          />
        ))}

        {cards.length < 6 && (
          <button
            onClick={addCard}
            className="w-full h-11 rounded-xl border border-dashed border-[#D0D0D0] text-sm text-[#6B7280] font-medium hover:border-primary hover:text-[oklch(0.280_0.110_95)] transition-colors"
          >
            + Add product
          </button>
        )}
      </div>

      {hasCalculated && (
        <HistoryPeek
          entries={entries}
          onDelete={deleteEntry}
          onClearAll={clearAll}
          onRestore={handleRestore}
          hasCurrentInput={hasAnyInput}
          triggerOpen={historyOpenTrigger}
        />
      )}
    </div>
  )
}
