import React from "react";
import { Receipt, BusinessProfile } from "../types";
import { formatCurrency, formatDate } from "../utils";


interface ReceiptPreviewProps {
  receipt: Receipt;
  businessProfile: BusinessProfile;
  isRegisteredUser: boolean;
}

export default function ReceiptPreview({ receipt, businessProfile, isRegisteredUser }: ReceiptPreviewProps) {
  const {
    receiptNumber,
    issueDate,
    dueDate,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    items = [],
    subtotal = 0,
    tax = 0,
    discount = 0,
    shipping = 0,
    total = 0,
    paymentMethod,
    paymentStatus,
    notes,
    templateStyle = "classic",
  } = receipt;

  // Render different template styles
  const isThermal = templateStyle === "thermal";
  const currencySymbol = businessProfile.currency || "$";

  // Dynamic QR Code link from a public QR generator for registered users
  // It encodes receipt metadata like Number, Date, Total, Status
  const qrData = `Receipt: ${receiptNumber} | Total: ${currencySymbol}${total} | Issued: ${issueDate} | Status: ${paymentStatus}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  // Payment Status classes
  const statusColors = {
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
    overdue: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
  };

  if (isThermal) {
    return (
      <div 
        id="printable-receipt" 
        className="mx-auto max-w-[340px] bg-white p-4 text-black font-mono text-xs shadow-md border border-gray-100 relative"
        style={{ color: "#000000", fontFamily: "Courier New, monospace" }}
      >
        {businessProfile.logo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <img
              src={businessProfile.logo}
              alt=""
              className="w-3/5 opacity-[0.04] object-contain"
              aria-hidden="true"
            />
          </div>
        )}
        {/* Thermal Header */}
        <div className="text-center space-y-1 mb-4">
          {businessProfile.logo && (
            <img src={businessProfile.logo} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />
          )}
          <h2 className="text-sm font-bold uppercase tracking-wider">{businessProfile.name || "RECEIPTFLOW GUEST"}</h2>
          {businessProfile.phone && <p>{businessProfile.phone}</p>}
          {businessProfile.email && <p className="text-[10px]">{businessProfile.email}</p>}
          {businessProfile.website && <p className="text-[10px]">{businessProfile.website}</p>}
          {businessProfile.address && <p className="text-[10px] leading-tight">{businessProfile.address}</p>}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Thermal Details */}
        <div className="space-y-1 my-2">
          <p className="flex justify-between">
            <span>RECEIPT #:</span>
            <span className="font-bold">{receiptNumber}</span>
          </p>
          <p className="flex justify-between">
            <span>DATE:</span>
            <span>{issueDate}</span>
          </p>
          {dueDate && (
            <p className="flex justify-between">
              <span>DUE DATE:</span>
              <span>{dueDate}</span>
            </p>
          )}
          <p className="flex justify-between">
            <span>PAY METHOD:</span>
            <span>{paymentMethod}</span>
          </p>
          <p className="flex justify-between uppercase">
            <span>STATUS:</span>
            <span className="font-bold">*** {paymentStatus} ***</span>
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Customer Details */}
        <div className="my-2">
          <p className="font-bold">CUSTOMER:</p>
          <p className="pl-2">{customerName || "Walk-in Customer"}</p>
          {customerPhone && <p className="pl-2">{customerPhone}</p>}
          {customerEmail && <p className="pl-2 text-[10px]">{customerEmail}</p>}
          {customerAddress && <p className="pl-2 text-[10px] leading-tight">{customerAddress}</p>}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Items Table */}
        <div className="my-2 space-y-1">
          <div className="flex justify-between font-bold">
            <span>ITEM</span>
            <span>QTY * PRICE = TOTAL</span>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="font-bold">{item.name || `Item ${idx + 1}`}</p>
              <p className="flex justify-between text-[11px] pl-2">
                <span>{item.quantity} x {formatCurrency(item.price, currencySymbol)}</span>
                <span>{formatCurrency(item.total, currencySymbol)}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Totals */}
        <div className="space-y-1 my-2">
          <p className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(subtotal, currencySymbol)}</span>
          </p>
          {discount > 0 && (
            <p className="flex justify-between text-red-600">
              <span>DISCOUNT:</span>
              <span>-{formatCurrency(discount, currencySymbol)}</span>
            </p>
          )}
          {tax > 0 && (
            <p className="flex justify-between">
              <span>TAX ({tax}%):</span>
              <span>{formatCurrency((subtotal * tax) / 100, currencySymbol)}</span>
            </p>
          )}
          {shipping > 0 && (
            <p className="flex justify-between">
              <span>SHIPPING:</span>
              <span>{formatCurrency(shipping, currencySymbol)}</span>
            </p>
          )}
          <div className="border-t border-dashed border-gray-400 my-1"></div>
          <p className="flex justify-between text-sm font-bold">
            <span>GRAND TOTAL:</span>
            <span>{formatCurrency(total, currencySymbol)}</span>
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2"></div>

        {/* Notes */}
        {notes && (
          <div className="my-2 text-[10px] text-center italic leading-tight">
            <p>{notes}</p>
          </div>
        )}

        {/* QR Code and Signature */}
        <div className="mt-4 flex flex-col items-center space-y-3">
          {isRegisteredUser && (
            <div className="text-center space-y-1">
              <img 
                src={qrUrl} 
                alt="Verification QR Code" 
                className="w-24 h-24 border border-gray-300 p-1 mx-auto bg-white"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              <p className="text-[8px] text-gray-500 uppercase">Scan to Verify Receipt</p>
            </div>
          )}

          {businessProfile.signature && (
            <div className="text-center border-t border-gray-300 w-32 pt-1 mt-2">
              <p className="font-serif italic text-sm">{businessProfile.signature}</p>
              <p className="text-[8px] uppercase tracking-wider text-gray-500">Authorized Sign</p>
            </div>
          )}
        </div>

        <div className="text-center text-[9px] mt-6 pt-2 border-t border-dashed border-gray-400">
          <p>Thank you for your business!</p>
          <p className="text-[7px] text-gray-300 mt-1 tracking-widest uppercase font-light">ReceiptFlow</p>
        </div>
      </div>
    );
  }

  // Styles for other themes
  const templates = {
    classic: {
      card: "bg-white text-slate-800 p-8 rounded-none border-t-[8px] border-amber-600 shadow-md",
      fontHeading: "font-serif text-slate-900",
      fontBody: "font-sans",
      accentBg: "bg-slate-100",
      borderClr: "border-slate-200",
      headerAlign: "text-left"
    },
    modern: {
      card: "bg-white text-slate-800 p-8 rounded-none border-l-[8px] border-indigo-600 shadow-md",
      fontHeading: "font-sans font-extrabold text-slate-900 tracking-tight",
      fontBody: "font-sans",
      accentBg: "bg-indigo-50/50",
      borderClr: "border-indigo-100",
      headerAlign: "text-left"
    },
    minimal: {
      card: "bg-white text-zinc-800 p-8 rounded-none shadow-sm border border-zinc-200",
      fontHeading: "font-sans font-light text-zinc-900 tracking-wide",
      fontBody: "font-sans",
      accentBg: "bg-zinc-50",
      borderClr: "border-zinc-100",
      headerAlign: "text-right"
    }
  };

  const style = templates[templateStyle as keyof typeof templates] || templates.classic;

  return (
    <div id="printable-receipt" className={`${style.card} ${style.fontBody} w-full min-h-0 overflow-visible flex flex-col select-none relative`}>
      {businessProfile.logo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <img
            src={businessProfile.logo}
            alt=""
            className="w-3/5 opacity-[0.04] object-contain"
            aria-hidden="true"
          />
        </div>
      )}
      {/* Top Header */}
      <div>
        <div className={`flex flex-col md:flex-row md:justify-between items-start md:items-center border-b ${style.borderClr} pb-6 gap-4`}>
          <div>
            {businessProfile.logo && (
              <img src={businessProfile.logo} alt="Logo" className="h-12 mb-2 object-contain" />
            )}
            <h1 className={`${style.fontHeading} text-2xl uppercase font-bold text-slate-900`}>
              {businessProfile.name || "RECEIPTFLOW GUEST"}
            </h1>
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              {businessProfile.phone && <p>Tel: {businessProfile.phone}</p>}
              {businessProfile.email && <p>Email: {businessProfile.email}</p>}
              {businessProfile.website && <p>Web: {businessProfile.website}</p>}
              {businessProfile.address && <p className="max-w-xs">{businessProfile.address}</p>}
            </div>
          </div>

          <div className="md:text-right space-y-2">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider">
              RECEIPT
            </div>
            <p className="text-xs font-bold text-gray-600">No: {receiptNumber}</p>
            <p className="text-xs text-gray-500">Date: {formatDate(issueDate)}</p>
            {dueDate && <p className="text-xs text-rose-500">Due: {formatDate(dueDate)}</p>}
          </div>
        </div>

        {/* Customer and Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div>
            <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Billed To</h3>
            <p className="text-sm font-bold text-gray-800">{customerName || "Walk-in Customer"}</p>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              {customerPhone && <p>Phone: {customerPhone}</p>}
              {customerEmail && <p>Email: {customerEmail}</p>}
              {customerAddress && <p className="max-w-xs leading-tight">{customerAddress}</p>}
            </div>
          </div>

          <div className="md:text-right flex flex-col md:items-end justify-between">
            <div>
              <h3 className="text-xs uppercase font-bold text-gray-400 mb-2">Payment Details</h3>
              <p className="text-xs font-medium text-gray-700">Method: <span className="font-bold">{paymentMethod}</span></p>
              {businessProfile.bankDetails && (
                <p className="text-[10px] text-gray-500 max-w-xs mt-1 italic whitespace-pre-line leading-tight">
                  {businessProfile.bankDetails}
                </p>
              )}
            </div>

            <div className="mt-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-medium uppercase tracking-wider ${statusColors[paymentStatus]}`}>
                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
                {paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`${style.accentBg} text-gray-600 uppercase font-bold tracking-wider border-b ${style.borderClr}`}>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className={`border-b ${style.borderClr} hover:bg-slate-50/50`}>
                  <td className="py-3 px-3 font-medium text-gray-800">{item.name || `Item ${index + 1}`}</td>
                  <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(item.price, currencySymbol)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-800">{formatCurrency(item.total, currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Totals & Stamps */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Notes and QR */}
          <div className="md:col-span-7 space-y-4">
            {notes && (
              <div className="rounded bg-slate-50 p-3 border border-slate-100">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Receipt Notes</p>
                <p className="text-xs text-gray-600 leading-tight whitespace-pre-wrap">{notes}</p>
              </div>
            )}
            
            {/* Show QR code if registered */}
            {isRegisteredUser && (
              <div className="flex items-center gap-3">
                <img 
                  src={qrUrl} 
                  alt="Receipt verification QR code" 
                  className="w-16 h-16 border border-gray-200 p-1 bg-white"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                <div className="text-[10px] text-gray-500">
                  <p className="font-bold text-gray-700 uppercase tracking-wide">VERIFIED RECEIPT</p>
                  <p>Authentic document backed by cloud storage.</p>
                  <p className="mt-0.5 text-[8px] font-mono text-gray-400">ID: {receiptNumber.replace(/[^a-zA-Z0-9]/g, "")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Totals & Signature */}
          <div className="md:col-span-5 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal, currencySymbol)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount, currencySymbol)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Tax ({tax}%):</span>
                  <span>{formatCurrency((subtotal * tax) / 100, currencySymbol)}</span>
                </div>
              )}
              {shipping > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Shipping:</span>
                  <span>{formatCurrency(shipping, currencySymbol)}</span>
                </div>
              )}
              <div className={`border-t ${style.borderClr} my-1.5`}></div>
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span>{formatCurrency(total, currencySymbol)}</span>
              </div>
            </div>

            {/* Signature & Stamp side-by-side */}
            {(businessProfile.signature || businessProfile.stamp) && (
              <div className="flex justify-end items-center gap-4 pt-2">
                {businessProfile.stamp && (
                  <div className="relative flex items-center justify-center border-2 border-dashed border-red-500/60 text-red-500/80 rounded-full w-14 h-14 rotate-[-12deg] text-[9px] font-extrabold uppercase text-center p-1 select-none">
                    <div className="leading-none">
                      <p className="text-[7px]">OFFICIAL</p>
                      <p className="text-[6px] tracking-wide font-mono">STAMP</p>
                      <p className="text-[7px]">APPROVED</p>
                    </div>
                  </div>
                )}
                {businessProfile.signature && (
                  <div className="text-right border-t border-gray-200 w-28 pt-1">
                    <p className="font-serif italic text-sm text-slate-800 tracking-wide select-none">{businessProfile.signature}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium mt-0.5">Authorized Sign</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-center text-[10px] text-gray-400 border-t border-slate-100 pt-4 mt-6">
          <p>Thank you for your business!</p>
          <p className="text-[7px] text-gray-200 mt-1 tracking-[0.2em] uppercase font-light">ReceiptFlow</p>
        </div>
      </div>
    </div>
  );
}
