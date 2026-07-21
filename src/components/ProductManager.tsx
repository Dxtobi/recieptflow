import React, { useState } from "react";
import { Product } from "../types";
import { formatCurrency } from "../utils";
import { Plus, Search, ShieldAlert, ShoppingBag, DollarSign, Tag } from "lucide-react";

interface ProductManagerProps {
  products: Product[];
  onAdd: (product: Omit<Product, "productId" | "userId">) => Promise<any>;
  currencySymbol: string;
  isRegisteredUser: boolean;
}

export default function ProductManager({
  products,
  onAdd,
  currencySymbol,
  isRegisteredUser,
}: ProductManagerProps) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);

  const isGuest = !isRegisteredUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAdd({ name, price: Number(price) || 0, sku });
      setName("");
      setPrice("");
      setSku("");
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {isGuest && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
          💡 **Offline Mode:** Your products and services database is saved locally in your browser. Register or sign in anytime to backup your catalogs.
        </div>
      )}
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product / Service
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Create Product Card</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Product / Service Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Consulting Hours"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">Unit Price ({currencySymbol}) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-0.5">SKU / Code</label>
              <input
                type="text"
                placeholder="e.g. CONSULT-01"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <ShoppingBag className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Products Added</p>
            <p className="text-xs text-zinc-500 mt-1">Get started by clicking 'Add Product / Service'.</p>
          </div>
        ) : (
          filtered.map((prod) => (
            <div
              key={prod.productId}
              className="bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 transition space-y-3 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-[130px]" title={prod.name}>{prod.name}</h4>
                  {prod.sku && (
                    <p className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" /> SKU: {prod.sku}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">{formatCurrency(prod.price, currencySymbol)}</p>
                <p className="text-[9px] text-zinc-400">unit price</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
