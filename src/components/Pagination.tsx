import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  loading 
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
      <button 
        className="login-button" 
        style={{ width: 'auto', padding: '8px 12px', background: '#fff', color: '#3d2b1f', border: '1px solid #e7e5e4', opacity: currentPage === 1 || loading ? 0.5 : 1 }}
        disabled={currentPage === 1 || loading}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <FiChevronLeft />
      </button>

      {start > 1 && (
        <>
          <button 
            className="login-button" 
            style={{ width: '40px', padding: '8px', background: '#fff', color: '#3d2b1f', border: '1px solid #e7e5e4' }}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {start > 2 && <span style={{ color: '#a8a29e' }}>...</span>}
        </>
      )}

      {pages.map(p => (
        <button 
          key={p}
          className="login-button" 
          style={{ 
            width: '40px', 
            padding: '8px', 
            background: currentPage === p ? 'var(--admin-accent)' : '#fff', 
            color: currentPage === p ? '#fff' : '#3d2b1f', 
            border: '1px solid #e7e5e4',
            fontWeight: currentPage === p ? '900' : '400'
          }}
          disabled={loading}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: '#a8a29e' }}>...</span>}
          <button 
            className="login-button" 
            style={{ width: '40px', padding: '8px', background: '#fff', color: '#3d2b1f', border: '1px solid #e7e5e4' }}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button 
        className="login-button" 
        style={{ width: 'auto', padding: '8px 12px', background: '#fff', color: '#3d2b1f', border: '1px solid #e7e5e4', opacity: currentPage === totalPages || loading ? 0.5 : 1 }}
        disabled={currentPage === totalPages || loading}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <FiChevronRight />
      </button>
    </div>
  );
};
