"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Database, Table2, Search, Filter, SortAsc, SortDesc, Download,
  X, Plus, ChevronDown, Loader2, RefreshCw, FileSpreadsheet, FileText
} from 'lucide-react';

// ========================
// TYPES
// ========================
type TableSource = 'synced_data' | 'managed_table' | 'query_execution';

type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'isNull' | 'isNotNull';

interface FilterCondition {
  id: string;
  column: string;
  operator: FilterOperator;
  value?: string;
}

interface SortCondition {
  column: string;
  direction: 'asc' | 'desc';
}

interface AvailableTable {
  name: string;
  rowCount?: number;
  source: string;
  id?: string;
}

interface QueryResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  columns?: any;
}

const OPERATORS: { value: FilterOperator; label: string; hasValue: boolean }[] = [
  { value: 'eq',         label: '= equals',        hasValue: true },
  { value: 'neq',        label: '≠ not equals',    hasValue: true },
  { value: 'contains',   label: '∋ contains',      hasValue: true },
  { value: 'startsWith', label: '⊏ starts with',   hasValue: true },
  { value: 'endsWith',   label: '⊐ ends with',     hasValue: true },
  { value: 'gt',         label: '> greater than',  hasValue: true },
  { value: 'gte',        label: '≥ greater or eq', hasValue: true },
  { value: 'lt',         label: '< less than',     hasValue: true },
  { value: 'lte',        label: '≤ less or eq',    hasValue: true },
  { value: 'isNull',     label: '∅ is null',       hasValue: false },
  { value: 'isNotNull',  label: '◉ is not null',   hasValue: false },
];

// ========================
// FILTER BUILDER
// ========================
function FilterBuilder({
  filters,
  columns,
  onAdd,
  onRemove,
  onUpdate,
}: {
  filters: FilterCondition[];
  columns: string[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<FilterCondition>) => void;
}) {
  return (
    <div className="space-y-2">
      {filters.map((f) => {
        const op = OPERATORS.find((o) => o.value === f.operator);
        return (
          <div key={f.id} className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 w-8 text-right">
              {filters.indexOf(f) === 0 ? 'WHERE' : 'AND'}
            </span>

            {/* Column */}
            <select
              value={f.column}
              onChange={(e) => onUpdate(f.id, { column: e.target.value })}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Select column…</option>
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Operator */}
            <select
              value={f.operator}
              onChange={(e) => onUpdate(f.id, { operator: e.target.value as FilterOperator })}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Value */}
            {op?.hasValue && (
              <input
                type="text"
                value={f.value ?? ''}
                onChange={(e) => onUpdate(f.id, { value: e.target.value })}
                placeholder="value…"
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            )}

            <button
              onClick={() => onRemove(f.id)}
              className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <Plus size={12} /> Add condition
      </button>
    </div>
  );
}

// ========================
// VIRTUAL TABLE
// ========================
function VirtualTable({
  data,
  columns,
  sorts,
  onSort,
}: {
  data: any[];
  columns: string[];
  sorts: SortCondition[];
  onSort: (col: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 40;
  const VISIBLE_ROWS = 20;
  const [scrollTop, setScrollTop] = useState(0);

  const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
  const endIdx = Math.min(startIdx + VISIBLE_ROWS + 2, data.length);
  const visibleRows = data.slice(startIdx, endIdx);
  const paddingTop = startIdx * ROW_HEIGHT;
  const paddingBottom = (data.length - endIdx) * ROW_HEIGHT;

  const getSortIcon = (col: string) => {
    const sort = sorts.find((s) => s.column === col);
    if (!sort) return null;
    return sort.direction === 'asc' ? <SortAsc size={12} className="text-blue-500" /> : <SortDesc size={12} className="text-blue-500" />;
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ maxHeight: `${VISIBLE_ROWS * ROW_HEIGHT + 44}px` }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <table className="w-full text-sm border-collapse" style={{ minWidth: `${columns.length * 140}px` }}>
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => onSort(col)}
                className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap select-none"
              >
                <div className="flex items-center gap-1.5">
                  {col}
                  {getSortIcon(col)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr style={{ height: paddingTop }}>
              <td colSpan={columns.length} />
            </tr>
          )}
          {visibleRows.map((row, rowIdx) => (
            <tr
              key={startIdx + rowIdx}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              style={{ height: ROW_HEIGHT }}
            >
              {columns.map((col) => {
                const val = row[col];
                const display = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                return (
                  <td
                    key={col}
                    className="px-4 py-2 text-slate-700 text-xs whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis"
                    title={display}
                  >
                    {display || <span className="text-slate-300 italic">null</span>}
                  </td>
                );
              })}
            </tr>
          ))}
          {paddingBottom > 0 && (
            <tr style={{ height: paddingBottom }}>
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ========================
// MAIN PAGE
// ========================
export default function DataExplorerPage() {
  // Table picker
  const [availableTables, setAvailableTables] = useState<{
    synced_data: AvailableTable[];
    managed_table: AvailableTable[];
    query_execution: AvailableTable[];
  }>({ synced_data: [], managed_table: [], query_execution: [] });

  const [selectedSource, setSelectedSource] = useState<TableSource>('synced_data');
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Query state
  const [result, setResult] = useState<QueryResult | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Filter / Sort state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortCondition[]>([]);

  // Search (client-side quick filter)
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available tables
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/data-explorer/tables');
        if (res.ok) {
          const data = await res.json();
          setAvailableTables(data);
          // Default select first stream if available
          if (data.synced_data?.length > 0) {
            setSelectedTable(data.synced_data[0].name);
          }
        }
      } catch {
        toast.error('Failed to load table list');
      }
    };
    load();
  }, []);

  // Execute query
  const executeQuery = useCallback(async (page = 1) => {
    if (!selectedSource) return;
    if (selectedSource !== 'query_execution' && !selectedTable) {
      toast.error('Select a table first');
      return;
    }
    setIsLoading(true);
    try {
      const body = {
        tableSource: selectedSource,
        tableName: selectedTable || undefined,
        filters: filters.filter((f) => f.column),
        sorts,
        page,
        pageSize: PAGE_SIZE,
      };
      const res = await apiFetch('/data-explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data: QueryResult = await res.json();
        setResult(data);
        setCurrentPage(page);
        if (data.data.length > 0) {
          setColumns(Object.keys(data.data[0]));
        } else {
          setColumns([]);
        }
      } else {
        const err = await res.json();
        toast.error(err.message ?? 'Query failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource, selectedTable, filters, sorts]);

  // Re-execute when table selection changes
  useEffect(() => {
    if (selectedTable || selectedSource === 'query_execution') {
      executeQuery(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, selectedTable]);

  // Filter actions
  const addFilter = () => {
    setFilters((prev) => [...prev, { id: Date.now().toString(), column: '', operator: 'eq', value: '' }]);
  };
  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id));
  const updateFilter = (id: string, patch: Partial<FilterCondition>) => {
    setFilters((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));
  };

  // Sort toggle
  const handleSort = (col: string) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.column === col);
      if (!existing) {
        const newSort: SortCondition = { column: col, direction: 'asc' };
        return [newSort, ...prev.filter((s) => s.column !== col)].slice(0, 3);
      }
      if (existing.direction === 'asc') {
        return prev.map((s): SortCondition => s.column === col ? { ...s, direction: 'desc' } : s);
      }
      return prev.filter((s) => s.column !== col); // remove on third click
    });
  };

  // Export
  const exportData = async (format: 'csv' | 'excel') => {
    const toastId = toast.loading(`Exporting as ${format.toUpperCase()}…`);
    try {
      const body = {
        tableSource: selectedSource,
        tableName: selectedTable || undefined,
        filters: filters.filter((f) => f.column),
        sorts,
        page: 1,
        pageSize: 10000,
      };
      const res = await apiFetch(`/data-explorer/export/${format === 'csv' ? 'csv' : 'excel'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-export.${format === 'csv' ? 'csv' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export complete!', { id: toastId });
      } else {
        toast.error('Export failed', { id: toastId });
      }
    } catch {
      toast.error('Connection error', { id: toastId });
    }
  };

  // Client-side search filter over visible data
  const filteredData = React.useMemo(() => {
    if (!result?.data || !searchTerm.trim()) return result?.data ?? [];
    const term = searchTerm.toLowerCase();
    return result.data.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(term))
    );
  }, [result?.data, searchTerm]);

  const currentTables = availableTables[selectedSource] ?? [];

  return (
    <div className="p-6 h-full flex flex-col gap-4 animate-in fade-in">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Data Explorer</h1>
            <p className="text-slate-500 text-xs mt-0.5">Browse, filter, sort & export your data</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => executeQuery(currentPage)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-800 px-3 py-2 rounded-xl hover:bg-emerald-50 border border-emerald-200 transition-colors"
          >
            <FileText size={14} /> Export CSV
          </button>

          <button
            onClick={() => exportData('excel')}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 px-3 py-2 rounded-xl hover:bg-blue-50 border border-blue-200 transition-colors"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── LEFT SIDEBAR — Table picker ── */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Source tabs */}
            <div className="flex border-b border-slate-100">
              {(['synced_data', 'managed_table', 'query_execution'] as TableSource[]).map((src) => (
                <button
                  key={src}
                  onClick={() => { setSelectedSource(src); setSelectedTable(''); setResult(null); }}
                  className={`flex-1 py-2.5 text-[11px] font-semibold text-center transition-colors ${selectedSource === src ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  {src === 'synced_data' ? 'Airbyte' : src === 'managed_table' ? 'Tables' : 'Queries'}
                </button>
              ))}
            </div>

            {/* Table list */}
            <div className="overflow-y-auto max-h-[500px]">
              {selectedSource === 'query_execution' ? (
                <button
                  onClick={() => executeQuery(1)}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-blue-700 bg-blue-50 border-l-2 border-blue-500 flex items-center gap-2"
                >
                  <Table2 size={14} /> Query Executions
                </button>
              ) : (
                currentTables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 transition-colors group ${selectedTable === t.name ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Table2 size={13} className={selectedTable === t.name ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-sm font-semibold truncate ${selectedTable === t.name ? 'text-blue-700' : 'text-slate-700'}`}>{t.name}</span>
                    </div>
                    {t.rowCount !== undefined && (
                      <span className="text-xs text-slate-400 ml-5">{t.rowCount.toLocaleString()} rows</span>
                    )}
                  </button>
                ))
              )}
              {currentTables.length === 0 && selectedSource !== 'query_execution' && (
                <div className="px-4 py-6 text-center text-slate-400 text-xs">No tables found</div>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Toolbar */}
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm">
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Quick search in results…"
                className="flex-1 text-sm focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border transition-colors ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              <Filter size={14} />
              Filters
              {filters.filter((f) => f.column).length > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters ? 'bg-white/30 text-white' : 'bg-blue-100 text-blue-700'}`}>
                  {filters.filter((f) => f.column).length}
                </span>
              )}
            </button>

            {/* Active sorts */}
            {sorts.length > 0 && (
              <div className="flex items-center gap-1">
                {sorts.map((s) => (
                  <span key={s.column} className="flex items-center gap-1 text-xs font-semibold bg-violet-100 text-violet-700 px-2 py-1 rounded-lg">
                    {s.direction === 'asc' ? <SortAsc size={11} /> : <SortDesc size={11} />}
                    {s.column}
                    <button onClick={() => setSorts((prev) => prev.filter((x) => x.column !== s.column))} className="hover:text-red-500"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={() => executeQuery(1)}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Apply
            </button>
          </div>

          {/* Filter Builder Panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-blue-200 px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Filter size={14} /> Filter Builder</h3>
                {filters.length > 0 && (
                  <button onClick={() => setFilters([])} className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear all</button>
                )}
              </div>
              <FilterBuilder
                filters={filters}
                columns={columns}
                onAdd={addFilter}
                onRemove={removeFilter}
                onUpdate={updateFilter}
              />
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Table2 size={15} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-700">
                  {selectedTable || (selectedSource === 'query_execution' ? 'Query Executions' : 'No table selected')}
                </span>
                {result && (
                  <span className="text-xs text-slate-400">
                    {filteredData.length.toLocaleString()} rows
                    {searchTerm && ` (filtered from ${result.data.length})`}
                    {' '}· Page {result.page} of {result.totalPages}
                  </span>
                )}
              </div>
              {isLoading && <Loader2 size={16} className="text-blue-500 animate-spin" />}
            </div>

            {/* Table body */}
            <div className="flex-1 overflow-hidden">
              {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Database size={40} className="opacity-30" />
                  <p className="font-medium">Select a table to explore data</p>
                  <p className="text-xs">Supports Airbyte synced data, managed tables, and query history</p>
                </div>
              )}
              {isLoading && (
                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                  <span className="text-sm font-medium">Loading data…</span>
                </div>
              )}
              {result && !isLoading && columns.length > 0 && (
                <VirtualTable
                  data={filteredData}
                  columns={columns}
                  sorts={sorts}
                  onSort={handleSort}
                />
              )}
              {result && !isLoading && columns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <p className="font-medium">No data found</p>
                  <p className="text-xs">Try adjusting your filters or selecting a different table</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {result && result.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                <span className="text-xs text-slate-500">
                  Showing rows {((result.page - 1) * result.pageSize) + 1}–{Math.min(result.page * result.pageSize, result.total)} of {result.total.toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => executeQuery(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg">
                    {currentPage} / {result.totalPages}
                  </span>
                  <button
                    onClick={() => executeQuery(currentPage + 1)}
                    disabled={currentPage >= result.totalPages || isLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
