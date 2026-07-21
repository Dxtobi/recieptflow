import React, { useState } from "react";
import { Receipt } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { Search, Filter, Copy, Trash2, Eye, Edit2, ShieldAlert, FileText } from "lucide-react";

interface HistoryListProps {
  receipts: Receipt[];
  currencySymbol: string;
  onSelect: (receipt: Receipt) => void;
  onEdit: (receipt: Receipt) => void;
  onDuplicate: (receipt: Receipt) => void;
  onDelete: (receiptId: string) => void;
  isRegisteredUser: boolean;
  onPromptAuth: () => void;
}

export default function HistoryList({
  receipts,
  currencySymbol,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  isRegisteredUser,
  onPromptAuth
}: HistoryListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter & Search computation
  const filtered = receipts.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || r.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by customer name, receipt #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Guest warning banner for History */}
      {!isRegisteredUser && (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-zinc-550 dark:text-zinc-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Offline Guest Mode Cache</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Your receipt log is stored in this browser's secure offline storage. Sign in anytime to secure them to our database.
              </p>
            </div>
          </div>
          <button
            onClick={onPromptAuth}
            className="text-xs font-bold px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg transition shrink-0"
          >
            Backup in Cloud
          </button>
        </div>
      )}

      {/* Receipts List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Search className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Receipts Found</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters, searching for someone else, or create your first receipt.</p>
          </div>
        ) : (
          filtered.map((receipt) => {
            const statusStyle = {
              paid: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-750",
              pending: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800",
              overdue: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
            }[receipt.paymentStatus];

            return (
              <div
                key={receipt.receiptId}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-sm gap-4"
              >
                {/* Info */}
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{receipt.customerName}</h4>
                      <span className={`inline-block px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${statusStyle}`}>
                        {receipt.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{receipt.receiptNumber}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Issued: {formatDate(receipt.issueDate)} • Method: {receipt.paymentMethod}</p>
                  </div>
                </div>

                {/* Pricing & Quick Controls */}
                <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 border-t md:border-t-0 border-zinc-50 dark:border-zinc-800/50 pt-3 md:pt-0">
                  <div className="md:text-right">
                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white">{formatCurrency(receipt.total, currencySymbol)}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{receipt.items.length} items</p>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelect(receipt)}
                      className="p-2 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 rounded-xl transition"
                      title="Preview Receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onEdit(receipt)}
                      className="p-2 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 rounded-xl transition"
                      title="Edit Receipt"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicate(receipt)}
                      className="p-2 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 rounded-xl transition"
                      title="Duplicate Receipt"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => receipt.receiptId && onDelete(receipt.receiptId)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 dark:bg-slate-800/40 dark:hover:bg-red-950/20 rounded-xl transition"
                      title="Delete Receipt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
