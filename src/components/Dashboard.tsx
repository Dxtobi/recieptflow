import React from "react";
import { DashboardStats, Receipt } from "../types";
import { formatCurrency } from "../utils";
import { TrendingUp, DollarSign, FileText, Users, Award, ShieldAlert } from "lucide-react";

interface DashboardProps {
  stats: DashboardStats | null;
  receipts: Receipt[];
  currencySymbol: string;
  onSelectReceipt: (receipt: Receipt) => void;
  onNavigateToReceipts: () => void;
}

export default function Dashboard({ stats, receipts, currencySymbol, onSelectReceipt, onNavigateToReceipts }: DashboardProps) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
        <ShieldAlert className="w-12 h-12 text-zinc-400 mb-3 animate-pulse" />
        <h3 className="font-bold text-zinc-800 dark:text-zinc-200">No Analytics Available</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Save some receipts or add items to build your real-time analytics panel.
        </p>
      </div>
    );
  }

  // Calculate status counts for our visual progress bar
  const totalCount = receipts.length || 1;
  const paidCount = receipts.filter(r => r.paymentStatus === "paid").length;
  const pendingCount = receipts.filter(r => r.paymentStatus === "pending").length;
  const overdueCount = receipts.filter(r => r.paymentStatus === "overdue").length;

  const paidPct = Math.round((paidCount / totalCount) * 100);
  const pendingPct = Math.round((pendingCount / totalCount) * 100);
  const overduePct = Math.round((overdueCount / totalCount) * 100);

  // Latest 3 receipts for quick look
  const recentReceipts = receipts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Revenue</p>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">{formatCurrency(stats.revenue, currencySymbol)}</h3>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Paid Invoices
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Monthly Sales</p>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">{formatCurrency(stats.monthlySales, currencySymbol)}</h3>
            <p className="text-[10px] text-zinc-500 font-semibold">Current Month</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Today's Sales</p>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">{formatCurrency(stats.todaySales, currencySymbol)}</h3>
            <p className="text-[10px] text-zinc-500 font-medium">Issued today</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Receipt Count */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Invoices Count</p>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">{stats.receiptCount}</h3>
            <p className="text-[10px] text-zinc-500 font-medium">All generated</p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Analytics Visualization and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Invoice status distribution & latest history */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Receipt Status Analysis</h3>
            <p className="text-xs text-zinc-500">Distribution of payments across all generated receipts</p>
          </div>

          {/* Visual Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full flex rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <div style={{ width: `${paidPct}%` }} className="h-full bg-zinc-900 dark:bg-zinc-100" title={`Paid: ${paidPct}%`}></div>
              <div style={{ width: `${pendingPct}%` }} className="h-full bg-zinc-400" title={`Pending: ${pendingPct}%`}></div>
              <div style={{ width: `${overduePct}%` }} className="h-full bg-zinc-200 dark:bg-zinc-600" title={`Overdue: ${overduePct}%`}></div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100"></span>
                <span>Paid ({paidPct || 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                <span>Pending ({pendingPct || 0}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-600"></span>
                <span>Overdue ({overduePct || 0}%)</span>
              </div>
            </div>
          </div>

          {/* Mini line / bar charts drawn cleanly */}
          <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Recent Receipts</h4>
              <button 
                onClick={onNavigateToReceipts}
                className="text-xs text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 font-bold hover:underline transition"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {recentReceipts.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">No receipts issued yet. Start creating!</p>
              ) : (
                recentReceipts.map((receipt) => (
                  <div 
                    key={receipt.receiptId}
                    onClick={() => onSelectReceipt(receipt)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{receipt.customerName}</p>
                        <p className="text-[10px] text-zinc-500">{receipt.receiptNumber} • {receipt.issueDate}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(receipt.total, currencySymbol)}
                      </p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${
                        receipt.paymentStatus === "paid" 
                          ? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" 
                          : receipt.paymentStatus === "pending"
                          ? "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                          : "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}>
                        {receipt.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Customers Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Top Customers</h3>
            <p className="text-xs text-zinc-500">Revenue Contribution</p>
          </div>

          <div className="space-y-3 pt-2">
            {stats.topCustomers.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <Users className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p className="text-xs">No customer billing history yet.</p>
              </div>
            ) : (
              stats.topCustomers.map((cust, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <span className="truncate max-w-[150px]">{cust.name}</span>
                    <span>{formatCurrency(cust.total, currencySymbol)}</span>
                  </div>
                  {/* Custom progress metric */}
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-zinc-900 dark:bg-zinc-100 h-full" 
                      style={{ 
                        width: `${Math.min(100, (cust.total / (stats.revenue || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subscriptions detail card */}
          <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-2 mt-4">
            <Award className="w-5 h-5 mx-auto text-zinc-900 dark:text-zinc-100" />
            <h4 className="text-xs font-extrabold uppercase text-zinc-950 dark:text-zinc-100">ReceiptFlow Status</h4>
            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You are running on **ReceiptFlow** with local offline speed, persistent data, and full PDF templates.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
