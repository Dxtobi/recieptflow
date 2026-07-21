import React, { useState } from "react";
import { Customer } from "../types";
import { Plus, Search, ShieldAlert, UserPlus, Phone, Mail, MapPin } from "lucide-react";

interface CustomerManagerProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, "customerId" | "userId">) => Promise<any>;
  isRegisteredUser: boolean;
}

export default function CustomerManager({
  customers,
  onAdd,
  isRegisteredUser,
}: CustomerManagerProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const isGuest = !isRegisteredUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd({ name, phone, email, address });
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {isGuest && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
          💡 **Offline Mode:** Your customer list is saved locally on your browser. Log in or register anytime to sync your directory across all your devices.
        </div>
      )}
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search customer by name, email, tel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl transition shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Add New Customer
        </button>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Create Customer Card</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Customer / Company Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800/60 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Save Customer"}
            </button>
          </div>
        </form>
      )}

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <UserPlus className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-350">No Customers Added</p>
            <p className="text-xs text-zinc-500 mt-1">Get started by clicking 'Add New Customer'.</p>
          </div>
        ) : (
          filtered.map((cust) => (
            <div
              key={cust.customerId}
              className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                  {cust.name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[150px]">{cust.name}</h4>
                  <p className="text-[10px] text-zinc-400 truncate">ID: {cust.customerId}</p>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800/60 pt-2">
                {cust.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </p>
                )}
                {cust.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </p>
                )}
                {cust.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{cust.address}</span>
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
