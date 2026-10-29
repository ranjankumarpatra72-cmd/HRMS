import React, { useState } from 'react';
import { Search, X, User, Briefcase, MapPin, ExternalLink } from 'lucide-react';
import { Employee } from '../../types/index';
import { apiFetch } from '../../utils/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiFetch(`/api/search/employees?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl border border-slate-200 space-y-4">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-2 bg-slate-100 rounded-xl border border-slate-200">
          <Search className="w-5 h-5 text-slate-400 ml-2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search employee by ID (e.g. EMP001), name, or designation..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {isSearching && (
            <p className="text-center text-xs text-slate-400 py-4 animate-pulse">Searching employee master database...</p>
          )}

          {!isSearching && query && results.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">No matching employee records found.</p>
          )}

          {results.map((emp) => (
            <div
              key={emp.employeeId}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-sky-500 transition-colors flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{emp.name}</span>
                  <span className="font-mono text-xs font-bold text-sky-600">({emp.employeeId})</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>{emp.designation}</span>
                  <span>•</span>
                  <span>{emp.office}</span>
                </div>
              </div>

              <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
