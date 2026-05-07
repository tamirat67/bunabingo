'use client';

type Cell = number | 'FREE';
interface Props {
  card: Cell[][];
  drawnNumbers: number[];
  highlightMode?: string | null;
}

const COL_LABELS = ['B', 'I', 'N', 'G', 'O'];

export default function BingoCard({ card, drawnNumbers, highlightMode }: Props) {
  const drawn = new Set(drawnNumbers);

  const isMarked = (val: Cell) => val === 'FREE' || drawn.has(val as number);

  return (
    <div className="bingo-wrapper" style={{ padding: '12px 16px' }}>
      {/* Column headers */}
      <div className="bingo-hdr">
        {COL_LABELS.map(c => (
          <div key={c} className="bingo-col">{c}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="bingo-grid">
        {card && card.map ? card.map((row, r) =>
          row && row.map ? row.map((cell, c) => {
            const marked = isMarked(cell);
            const isFree = cell === 'FREE';
            return (
              <div
                key={`${r}-${c}`}
                className={`bingo-cell${isFree ? ' free' : marked ? ' marked' : ''}`}
                style={highlightMode && marked ? { boxShadow: '0 0 16px var(--gold-glow)' } : {}}
              >
                {isFree ? '⭐' : cell}
              </div>
            );
          }) : null
        ) : <div className="loading-card">Loading Card...</div>}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--txt2)' }}>
        <span>Marked: {card && card.flat ? card.flat().filter(c => isMarked(c)).length : 0} / 25</span>
        <span>Numbers drawn: {drawnNumbers.length}</span>
      </div>
    </div>
  );
}

