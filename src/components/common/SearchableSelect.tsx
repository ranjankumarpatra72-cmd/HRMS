import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface OptionItem {
  id: string;
  name: string;
  code?: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: OptionItem[];
  value: string; // selected ID or Name
  onChange: (value: string, selectedOption?: OptionItem) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find current selected option by id or name
  const selectedOption = options.find((opt) => opt.id === value || opt.name === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.code && opt.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (opt: OptionItem) => {
    onChange(opt.id, opt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Select Box */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3 py-2 bg-white border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          disabled
            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
            : error
            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
            : isOpen
            ? 'border-sky-600 ring-2 ring-sky-100'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <span className="truncate text-xs text-slate-800 font-medium">
          {selectedOption ? selectedOption.name : <span className="text-slate-400">{placeholder}</span>}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedOption && !disabled && (
            <button
              type="button"
              id={`${id}-clear-btn`}
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500 font-medium mt-1">{error}</p>}

      {/* Searchable Dropdown Popup */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Filter Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              id={`${id}-search-input`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs text-slate-400 hover:text-slate-600 mr-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Option List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value || opt.name === value;
                return (
                  <div
                    key={opt.id}
                    id={`${id}-option-${opt.id}`}
                    onClick={() => handleSelect(opt)}
                    className={`px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{opt.name}</span>
                      {opt.subtitle && (
                        <span className="text-[10px] text-slate-400">{opt.subtitle}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching {label.toLowerCase()} found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
