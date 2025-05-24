import React from 'react'
import './SearchInput.scss'

// AI-powered search suggestion placeholder (for future integration)
// You could connect this to an AI API for smart suggestions

const SearchInput = ({ value, onChange, placeholder, suggestions = [] }) => (
  <div className="search-input">
    <span className="search-icon">
      <svg
        width="20"
        height="20"
        fill="none"
        stroke="#4f8cff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </span>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder || 'Search...'}
      className="search-input__input"
      autoComplete="off"
    />
    {value && (
      <button
        className="search-input__clear"
        onClick={() => onChange({ target: { value: '' } })}
        aria-label="Clear search"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="#b0b8d1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    )}
    {/* AI suggestions dropdown (future): */}
    {suggestions.length > 0 && (
      <ul className="search-input__suggestions">
        {suggestions.map((s, i) => (
          <li key={i} onClick={() => onChange({ target: { value: s } })}>
            {s}
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default SearchInput
