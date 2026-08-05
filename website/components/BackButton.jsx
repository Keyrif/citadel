import React from 'react';

export function BackButton({ onClick }) {
  return (
    <button
      type="button"
      className="back-button"
      onClick={onClick}
      aria-label="Back"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.5 5.5L8 12l6.5 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}