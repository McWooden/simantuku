'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

export function SearchableSelect({ 
  name, 
  value, 
  defaultValue = '',
  onChange, 
  options, 
  placeholder = 'Pilih...', 
  searchPlaceholder = 'Cari...', 
  className = '',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : defaultValue)
  const containerRef = useRef(null)

  // Sync state if controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  // Sync state if defaultValue changes
  useEffect(() => {
    if (defaultValue !== undefined && value === undefined) {
      setSelectedValue(defaultValue)
    }
  }, [defaultValue, value])
  
  // Format options to always be array of { value, label }
  const formattedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt }
    }
    return opt
  })

  // Find currently selected option
  const selectedOption = formattedOptions.find(opt => opt.value === selectedValue)

  // Filter options based on search query
  const filteredOptions = formattedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search query when dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleSelect = (val) => {
    setSelectedValue(val)
    if (onChange) {
      onChange(val)
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0].value)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Hidden input for HTML form submission (Server Actions) */}
      <input type="hidden" name={name} value={selectedValue || ''} required={required} />
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left border-slate-200"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-none mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-200 border-slate-200 bg-white">
          {/* Search Input */}
          <div className="flex items-center border-b border-slate-100 px-3 bg-slate-50/50">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0 focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:bg-slate-100 rounded-full p-1 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-[220px] overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm text-slate-400 justify-center">
                Tidak ada hasil ditemukan.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-slate-50 text-slate-700 text-left ${opt.value === selectedValue ? 'bg-slate-100/80 font-semibold text-slate-900' : ''}`}
                >
                  {opt.value === selectedValue && (
                    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
