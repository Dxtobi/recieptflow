import React, { useState, useEffect } from "react";
import { Receipt, ReceiptItem, Customer, Product, BusinessProfile } from "../types";
import { generateReceiptNumber } from "../utils";
import { Plus, Trash2, Save, Eye, RefreshCw, Sparkles, Camera, X, QrCode } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import ReceiptPreview from "./ReceiptPreview";

interface ReceiptFormProps {
  initialReceipt: Receipt;
  customers: Customer[];
  products: Product[];
  currencySymbol: string;
  businessProfile: BusinessProfile;
  onSave: (receipt: Receipt) => void;
  onPreview: (receipt: Receipt) => void;
  isRegisteredUser: boolean;
}

export default function ReceiptForm({
  initialReceipt,
  customers,
  products,
  currencySymbol,
  businessProfile,
  onSave,
  onPreview,
  isRegisteredUser
}: ReceiptFormProps) {
  const [receipt, setReceipt] = useState<Receipt>(initialReceipt);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);
  const [scanStatus, setScanStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(!!(initialReceipt.customerPhone || initialReceipt.customerEmail || initialReceipt.customerAddress));
  const [showNotes, setShowNotes] = useState(!!initialReceipt.notes);

  const handleParsedData = (dataStr: string) => {
    try {
      // 1. Try JSON parsing
      const parsed = JSON.parse(dataStr);
      
      // Check if it's a customer
      if (parsed.type === "customer" || parsed.customerName || (parsed.name && (parsed.email || parsed.phone || parsed.address))) {
        const name = parsed.customerName || parsed.name || "";
        setReceipt(prev => ({
          ...prev,
          customerName: name,
          customerPhone: parsed.customerPhone || parsed.phone || prev.customerPhone,
          customerEmail: parsed.customerEmail || parsed.email || prev.customerEmail,
          customerAddress: parsed.customerAddress || parsed.address || prev.customerAddress
        }));
        setScanStatus({ success: true, message: `Scanned Customer: ${name}` });
        setTimeout(() => setIsScanning(false), 1500);
        return;
      }
      
      // Check if it's a product
      if (parsed.type === "product" || parsed.sku || parsed.price !== undefined) {
        const name = parsed.productName || parsed.name || "Scanned Item";
        const price = Number(parsed.price) || 0;
        const qty = Number(parsed.quantity || parsed.qty) || 1;
        
        setReceipt(prev => {
          let updatedItems = [...prev.items];
          // If the only item is empty, overwrite it
          if (updatedItems.length === 1 && !updatedItems[0].name && updatedItems[0].price === 0) {
            updatedItems[0] = { name, quantity: qty, price, total: qty * price };
          } else {
            updatedItems.push({ name, quantity: qty, price, total: qty * price });
          }
          const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
          return {
            ...prev,
            items: updatedItems,
            subtotal,
            total
          };
        });
        setScanStatus({ success: true, message: `Added item: ${name} (${currencySymbol}${price.toFixed(2)})` });
        setTimeout(() => setScanStatus(null), 2000);
        return;
      }
    } catch (e) {
      // Treat as raw text/SKU
      const trimmed = dataStr.trim();
      
      // Try SKU lookup in database products
      const matchedProduct = products.find(p => p.sku?.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase());
      if (matchedProduct) {
        setReceipt(prev => {
          let updatedItems = [...prev.items];
          if (updatedItems.length === 1 && !updatedItems[0].name && updatedItems[0].price === 0) {
            updatedItems[0] = { name: matchedProduct.name, quantity: 1, price: matchedProduct.price, total: matchedProduct.price };
          } else {
            updatedItems.push({ name: matchedProduct.name, quantity: 1, price: matchedProduct.price, total: matchedProduct.price });
          }
          const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
          return {
            ...prev,
            items: updatedItems,
            subtotal,
            total
          };
        });
        setScanStatus({ success: true, message: `Found Product: ${matchedProduct.name} (${currencySymbol}${matchedProduct.price.toFixed(2)})` });
        setTimeout(() => setScanStatus(null), 2000);
        return;
      }
      
      // Try customer lookup in database customers
      const matchedCustomer = customers.find(c => c.name.toLowerCase() === trimmed.toLowerCase() || c.customerId === trimmed);
      if (matchedCustomer) {
        setSelectedCustomerId(matchedCustomer.customerId);
        setReceipt(prev => ({
          ...prev,
          customerId: matchedCustomer.customerId,
          customerName: matchedCustomer.name,
          customerPhone: matchedCustomer.phone,
          customerEmail: matchedCustomer.email,
          customerAddress: matchedCustomer.address
        }));
        setScanStatus({ success: true, message: `Matched Customer: ${matchedCustomer.name}` });
        setTimeout(() => setIsScanning(false), 1500);
        return;
      }
      
      // Check if it's an email address
      if (trimmed.includes("@") && trimmed.includes(".")) {
        setReceipt(prev => ({ ...prev, customerEmail: trimmed }));
        setScanStatus({ success: true, message: `Set customer email: ${trimmed}` });
        setTimeout(() => setScanStatus(null), 2000);
        return;
      }
      
      // Check if it's a phone number
      if (/^\+?[0-9\s\-()]{7,20}$/.test(trimmed)) {
        setReceipt(prev => ({ ...prev, customerPhone: trimmed }));
        setScanStatus({ success: true, message: `Set customer phone: ${trimmed}` });
        setTimeout(() => setScanStatus(null), 2000);
        return;
      }
      
      // Generic fallback: add as custom item
      setReceipt(prev => {
        let updatedItems = [...prev.items];
        if (updatedItems.length === 1 && !updatedItems[0].name && updatedItems[0].price === 0) {
          updatedItems[0] = { name: trimmed, quantity: 1, price: 0, total: 0 };
        } else {
          updatedItems.push({ name: trimmed, quantity: 1, price: 0, total: 0 });
        }
        const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
        return {
          ...prev,
          items: updatedItems,
          subtotal,
          total
        };
      });
      setScanStatus({ success: true, message: `Added custom item: "${trimmed}"` });
      setTimeout(() => setScanStatus(null), 2000);
    }
  };

  // Camera scanning effect using html5-qrcode
  useEffect(() => {
    let html5QrCode: any = null;
    if (isScanning && !simulationMode) {
      setScanError(null);
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode("qr-reader");
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: (width: number, height: number) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              }
            },
            (decodedText: string) => {
              handleParsedData(decodedText);
            },
            () => {} // silent scan failures
          ).catch((err: any) => {
            console.error("Failed to start scanner:", err);
            setScanError("Failed to access camera. Please check permissions or use Demo Simulator.");
          });
        } catch (e) {
          console.error("Scanner initialization error:", e);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          try {
            if (html5QrCode.isScanning) {
              html5QrCode.stop().catch((err: any) => console.error("Stop failed", err));
            }
          } catch (err) {
            console.error("Clean up scanner error:", err);
          }
        }
      };
    }
  }, [isScanning, simulationMode]);

  useEffect(() => {
    setReceipt(initialReceipt);
    if (initialReceipt.customerId) {
      setSelectedCustomerId(initialReceipt.customerId);
    } else {
      setSelectedCustomerId("");
    }
  }, [initialReceipt]);

  // Handle direct customer selection (Registered users)
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);

    if (custId === "new") {
      // Keep custom inputs open or clear them
      setReceipt(prev => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: ""
      }));
      return;
    }

    const selected = customers.find(c => c.customerId === custId);
    if (selected) {
      setReceipt(prev => ({
        ...prev,
        customerId: selected.customerId,
        customerName: selected.name,
        customerPhone: selected.phone,
        customerEmail: selected.email,
        customerAddress: selected.address
      }));
    } else {
      setReceipt(prev => ({
        ...prev,
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: ""
      }));
    }
  };

  // Dynamic calculations
  const calculateTotals = (itemsList: ReceiptItem[], discountVal: number, taxRate: number, shippingVal: number) => {
    const sub = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price) || 0), 0);
    const taxAmt = (sub * Number(taxRate)) / 100;
    const finalTotal = Math.max(0, sub + taxAmt + Number(shippingVal) - Number(discountVal));

    return {
      subtotal: sub,
      total: finalTotal
    };
  };

  const handleFieldChange = (field: keyof Receipt, value: any) => {
    setReceipt(prev => {
      const updated = { ...prev, [field]: value };
      
      // If changing subtotal related values, recalculate
      if (field === "discount" || field === "tax" || field === "shipping") {
        const { subtotal, total } = calculateTotals(
          updated.items,
          field === "discount" ? Number(value) : Number(updated.discount),
          field === "tax" ? Number(value) : Number(updated.tax),
          field === "shipping" ? Number(value) : Number(updated.shipping)
        );
        updated.subtotal = subtotal;
        updated.total = total;
      }
      return updated;
    });
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    setReceipt(prev => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: value };
      
      if (field === "quantity" || field === "price") {
        item.total = (Number(item.quantity) || 0) * (Number(item.price) || 0);
      }
      updatedItems[index] = item;

      const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        total
      };
    });
  };

  // Autofill an item from selected product (Registered users)
  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.productId === productId);
    if (prod) {
      handleItemChange(index, "name", prod.name);
      handleItemChange(index, "price", prod.price);
    }
  };

  const addItemRow = () => {
    setReceipt(prev => {
      const updatedItems = [...prev.items, { name: "", quantity: 1, price: 0, total: 0 }];
      const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        total
      };
    });
  };

  const removeItemRow = (index: number) => {
    if (receipt.items.length <= 1) return;
    setReceipt(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const { subtotal, total } = calculateTotals(updatedItems, Number(prev.discount), Number(prev.tax), Number(prev.shipping));
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        total
      };
    });
  };

  const regenerateNumber = () => {
    handleFieldChange("receiptNumber", generateReceiptNumber("RF"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt.customerName.trim()) {
      alert("Please provide a Customer Name");
      return;
    }
    onSave(receipt);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">New Receipt</h2>
            <p className="text-xs text-zinc-500">Fill in the basics, we handle the math</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Template Style Switcher */}
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              {(["classic", "modern", "minimal", "thermal"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleFieldChange("templateStyle", style)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md capitalize transition ${
                    receipt.templateStyle === style
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Camera QR scan activator */}
            <button
              type="button"
              onClick={() => { setIsScanning(true); setScanStatus(null); setScanError(null); }}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-400 text-[10px] font-bold rounded-lg transition border border-indigo-200/40 dark:border-indigo-900/30"
              title="Scan customer or product QR codes"
            >
              <Camera className="w-3 h-3" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
        </div>

      {/* Meta Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Receipt Number</label>
          <div className="relative">
            <input
              type="text"
              required
              value={receipt.receiptNumber}
              onChange={(e) => handleFieldChange("receiptNumber", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={regenerateNumber}
              className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              title="Regenerate Receipt Number"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Issue Date</label>
          <input
            type="date"
            required
            value={receipt.issueDate}
            onChange={(e) => handleFieldChange("issueDate", e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Due Date <span className="text-zinc-400 font-normal">(Optional)</span></label>
          <input
            type="date"
            value={receipt.dueDate || ""}
            onChange={(e) => handleFieldChange("dueDate", e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Customer Info Section */}
      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Customer</h3>
          
          {customers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 hidden sm:inline">Saved:</span>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                className="text-xs font-medium px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none max-w-[160px] truncate"
              >
                <option value="">-- Choose --</option>
                {customers.map(c => (
                  <option key={c.customerId} value={c.customerId}>{c.name}</option>
                ))}
                <option value="new">+ New</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            type="text"
            required
            placeholder="Customer name *"
            value={receipt.customerName}
            onChange={(e) => handleFieldChange("customerName", e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => setShowContactDetails(!showContactDetails)}
            className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-xl transition shrink-0"
          >
            {showContactDetails ? "Hide" : "Contact +"}
          </button>
        </div>

        {showContactDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-1">
            <input
              type="text"
              placeholder="Phone"
              value={receipt.customerPhone || ""}
              onChange={(e) => handleFieldChange("customerPhone", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            <input
              type="email"
              placeholder="Email"
              value={receipt.customerEmail || ""}
              onChange={(e) => handleFieldChange("customerEmail", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            <input
              type="text"
              placeholder="Address"
              value={receipt.customerAddress || ""}
              onChange={(e) => handleFieldChange("customerAddress", e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Items Table</h3>
          <p className="text-[10px] text-zinc-400 italic">Add at least one item line to generate total</p>
        </div>

        <div className="space-y-3">
          {receipt.items.map((item, idx) => (
            <div key={idx} className="flex flex-col md:flex-row items-start md:items-end gap-2 sm:gap-3 p-2 sm:p-3 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
              
              {/* Product Select (for everyone) */}
              {products.length > 0 && (
                <div className="w-full md:w-44">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Product Quickfill</label>
                  <select
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">-- Choose --</option>
                    {products.map(p => (
                      <option key={p.productId} value={p.productId}>{p.name} ({currencySymbol}{p.price})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="UI Design Retainer, Consulting hours, etc."
                  value={item.name}
                  onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="w-full md:w-20">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Qty</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="w-full md:w-28">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">Price ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={item.price}
                  onChange={(e) => handleItemChange(idx, "price", Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="w-full md:w-28 text-right self-center md:pb-2">
                <p className="text-[10px] uppercase font-bold text-zinc-400">Total</p>
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {currencySymbol}{(item.quantity * item.price || 0).toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeItemRow(idx)}
                disabled={receipt.items.length <= 1}
                className="p-1.5 text-zinc-400 hover:text-red-500 disabled:opacity-30 self-center transition"
                title="Remove Item Row"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItemRow}
            className="flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-350 transition mt-1"
          >
            <Plus className="w-4 h-4" /> Add Item Line
          </button>
        </div>
      </div>

      {/* Payment & Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Payment</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">Method</label>
              <select
                value={receipt.paymentMethod}
                onChange={(e) => handleFieldChange("paymentMethod", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="PayPal">PayPal</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">Status</label>
              <select
                value={receipt.paymentStatus}
                onChange={(e) => handleFieldChange("paymentStatus", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition"
            >
              {showNotes ? "−" : "+"} {showNotes ? "Hide Notes" : "Add Notes"}
            </button>
            {showNotes && (
              <textarea
                placeholder="e.g. Terms: Net 15. Thank you for your business!"
                value={receipt.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                rows={3}
                className="w-full mt-2 px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            )}
          </div>
        </div>

        {/* Calculation Summary Fields */}
        <div className="space-y-4 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Financial Summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{currencySymbol}{receipt.subtotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Discount ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receipt.discount}
                  onChange={(e) => handleFieldChange("discount", Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={receipt.tax}
                  onChange={(e) => handleFieldChange("tax", Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Shipping ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receipt.shipping}
                  onChange={(e) => handleFieldChange("shipping", Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-semibold text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 my-2 pt-2"></div>

            <div className="flex items-center justify-between text-base">
              <span className="text-zinc-700 dark:text-zinc-300 font-bold">Grand Total</span>
              <span className="font-extrabold text-zinc-950 dark:text-white text-lg">
                {currencySymbol}{receipt.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2 flex-wrap">
        <button
          type="button"
          onClick={() => onPreview(receipt)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition"
        >
          <Eye className="w-3.5 h-3.5" /> Full Screen Preview
        </button>

        <button
          type="submit"
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 shadow-sm rounded-xl transition"
        >
          <Save className="w-3.5 h-3.5" /> {isRegisteredUser ? "Save to Cloud" : "Issue Receipt"}
        </button>
      </div>
    </form>

    {/* QR Code Scanner Overlay Modal */}
    {isScanning && (
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-2 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">Device Camera QR Scanner</h3>
                <p className="text-[10px] text-zinc-500 truncate">Scan customer details or product SKUs/barcodes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsScanning(false)}
              className="p-1.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {scanError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100 dark:border-rose-900/40">
                <X className="w-4 h-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Scanner frame */}
            {!simulationMode ? (
              <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/30 flex flex-col items-center justify-center">
                {/* The actual HTML5 QR Code element */}
                <div id="qr-reader" className="w-full h-full"></div>
                
                {/* Overlay target frame */}
                <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-xl relative">
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></span>
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></span>
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></span>
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 relative overflow-hidden">
                <div className="w-20 h-20 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                  <QrCode className="w-10 h-10 animate-pulse text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">QR Camera Simulator Active</p>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs">Use the interactive simulation buttons below to test scanning inputs instantly without a physical camera.</p>
                </div>
              </div>
            )}

            {/* Scan Status Feedback */}
            {scanStatus && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                scanStatus.success 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
              }`}>
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                <span>{scanStatus.message}</span>
              </div>
            )}

            {/* Mode Selector */}
            <div className="flex items-center justify-between border-t border-zinc-150 dark:border-zinc-800 pt-4">
              <span className="text-xs font-bold text-zinc-500">Scanner Mode:</span>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setSimulationMode(false); setScanStatus(null); setScanError(null); }}
                  className={`px-2.5 py-1 rounded-md transition ${!simulationMode ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:white shadow-xs" : "text-zinc-400"}`}
                >
                  Real Camera
                </button>
                <button
                  type="button"
                  onClick={() => { setSimulationMode(true); setScanStatus(null); setScanError(null); }}
                  className={`px-2.5 py-1 rounded-md transition ${simulationMode ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:white shadow-xs" : "text-zinc-400"}`}
                >
                  Demo Simulator
                </button>
              </div>
            </div>

            {/* Simulators */}
            {simulationMode && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Simulate Scanning Inputs:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleParsedData(JSON.stringify({
                      type: "customer",
                      name: "Eleanor Vance",
                      phone: "+1 (555) 382-9921",
                      email: "eleanor@vancecorp.co",
                      address: "4820 Broadway Ave, New York, NY"
                    }))}
                    className="p-2 text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl text-left transition"
                  >
                    💼 Sample Customer QR
                    <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Eleanor Vance (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleParsedData(JSON.stringify({
                      type: "product",
                      name: "Premium Subscription Setup",
                      price: 299.99,
                      sku: "SUB-PRO-01"
                    }))}
                    className="p-2 text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl text-left transition"
                  >
                    📦 Custom Product QR
                    <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Premium Subscription (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleParsedData("CONS-01")}
                    className="p-2 text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl text-left transition"
                  >
                    🏷️ DB SKU: CONS-01
                    <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Consulting Hours (Database)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleParsedData("PROD-01")}
                    className="p-2 text-[10px] font-bold bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl text-left transition"
                  >
                    🏷️ DB SKU: PROD-01
                    <span className="block text-[8px] text-zinc-400 font-normal mt-0.5">Standard Desk Item (Database)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
);
}
