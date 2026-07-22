import React, { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { Receipt, Customer, Product } from "./types";
import { formatCurrency, generateReceiptNumber } from "./utils";
import ReceiptForm from "./components/ReceiptForm";
import ReceiptPreview from "./components/ReceiptPreview";
import Dashboard from "./components/Dashboard";
import HistoryList from "./components/HistoryList";
import SettingsView from "./components/SettingsView";
import CustomerManager from "./components/CustomerManager";
import ProductManager from "./components/ProductManager";
import html2canvas from "html2canvas";
import { isNativeApp, isWeb } from "./utils/platform";

import {
  FileText,
  PlusCircle,
  History,
  Users,
  ShoppingBag,
  Settings,
  LogOut,
  ArrowRight,
  Zap,
  User,
  Lock,
  Loader,
  X,
  Printer,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Menu,
  Moon,
  Sun
} from "lucide-react";

function AppContent() {
  const store = useAppStore();
  const { theme, toggleTheme } = useTheme();
  
  // App navigation state: "landing", "auth", "workspace"
  const [appState, setAppState] = useState<"landing" | "auth" | "workspace">(
    isNativeApp() ? "auth" : "landing"
  );
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "history" | "customers" | "products" | "settings">("create");
  
  // Auth Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Full Screen Preview Modal State
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [landingStats, setLandingStats] = useState<{ totalReceipts: number; totalUsers: number; totalDownloads: number } | null>(null);

  // Initialize store and check previous sessions
  useEffect(() => {
    const checkSession = async () => {
      await store.init();
      if (useAppStore.getState().user) {
        setAppState("workspace");
        setActiveTab("dashboard");
      } else if (useAppStore.getState().isGuest) {
        setAppState("workspace");
        setActiveTab("create");
      }
    };
    checkSession();
  }, []);

  // Handle Google OAuth redirect (token in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const authError = params.get("auth_error");
    if (token) {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Exchange token for user and log in
      const apiBase = import.meta.env.VITE_API_URL || "";
      fetch(`${apiBase}/api/auth/google/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then(r => r.json())
        .then(user => {
          if (user.uid) {
            store.setUser(user);
            setAppState("workspace");
            setActiveTab("dashboard");
          }
        })
        .catch(console.error);
    } else if (authError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fetch public landing page stats
  useEffect(() => {
    if (appState !== "landing") return;
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setLandingStats(d))
      .catch(() => {});
  }, [appState]);

  // Autofill login credentials for Demo User to make testing simple and delightful!
  const autofillDemo = () => {
    setEmail("demo@receiptflow.com");
    setPassword("password");
    setAuthMode("login");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) return;
    
    const success = await store.login(email, password);
    if (success) {
      setAppState("workspace");
      setActiveTab("dashboard");
      setEmail("");
      setPassword("");
    } else {
      setFormError(store.error || "Invalid credentials");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) return;

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    
    const success = await store.register(email, password);
    if (success) {
      setAppState("workspace");
      setActiveTab("settings"); // Let them fill business details first
      setEmail("");
      setPassword("");
    } else {
      setFormError(store.error || "User already exists or registration failed");
    }
  };

  const startAsGuest = () => {
    store.setGuestMode(true);
    setAppState("workspace");
    setActiveTab("create");
  };

  const handleLogout = () => {
    store.logout();
    setAppState("landing");
  };

  const GUEST_MAX_RECEIPTS = 5;

  // Receipt creation / editing submission handler
  const handleSaveReceipt = async (receipt: Receipt) => {
    if (receipt.receiptId) {
      // Edit existing
      const success = await store.updateReceipt(receipt.receiptId, receipt);
      if (success) {
        setPreviewReceipt(receipt);
        setActiveTab("history");
      }
    } else {
      // Guest limit check
      if (!isRegisteredUser && store.receipts.length >= GUEST_MAX_RECEIPTS) {
        alert(`Guest limit reached (${GUEST_MAX_RECEIPTS} receipts). Sign in to create unlimited receipts.`);
        return;
      }
      const created = await store.addReceipt(receipt);
      if (created) {
        setPreviewReceipt(created);
        store.resetActiveReceipt();
        setActiveTab("history");
      }
    }
  };

  const handleEditReceiptClick = (receipt: Receipt) => {
    store.setActiveReceipt(receipt);
    setActiveTab("create");
  };

  const handleDuplicateReceiptClick = (receipt: Receipt) => {
    const duplicated: Receipt = {
      ...receipt,
      receiptId: undefined, // Strip ID
      receiptNumber: generateReceiptNumber("RF"), // new sequential receipt number
      issueDate: new Date().toISOString().split('T')[0], // current date
    };
    store.setActiveReceipt(duplicated);
    setActiveTab("create");
  };

  const handleDeleteReceiptClick = async (receiptId: string) => {
    await store.deleteReceipt(receiptId);
  };

  // Image capture & Export utilizing html2canvas
  const exportAsImage = async (format: "png" | "jpg") => {
    const target = document.getElementById("printable-receipt");
    if (!target) return;
    
    setIsExporting(true);
    try {
      await Promise.all(
        Array.from(target.querySelectorAll("img")).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
        )
      );
      await new Promise(r => setTimeout(r, 300));

      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "600px";
      clone.style.overflow = "visible";
      clone.style.aspectRatio = "auto";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 600,
        height: clone.scrollHeight,
        windowWidth: 600,
        windowHeight: clone.scrollHeight,
      });
      
      document.body.removeChild(clone);

      const image = canvas.toDataURL(`image/${format === "png" ? "png" : "jpeg"}, 0.95`);
      const link = document.createElement("a");
      link.download = `Receipt-${previewReceipt?.receiptNumber || "Flow"}.${format}`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Export to image failed", err);
      try {
        const canvas = await html2canvas(target, { scale: 1, useCORS: true, backgroundColor: "#ffffff" });
        const image = canvas.toDataURL(`image/${format === "png" ? "png" : "jpeg"}`);
        const link = document.createElement("a");
        link.download = `Receipt-${previewReceipt?.receiptNumber || "Flow"}.${format}`;
        link.href = image;
        link.click();
      } catch (err2) {
        console.error("Fallback export also failed", err2);
        alert("Export failed. Try using Print instead.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Track app download
  const handleDownload = async () => {
    try {
      const res = await fetch("/api/track-download", { method: "POST" });
      const data = await res.json();
      setLandingStats(prev => prev ? { ...prev, totalDownloads: data.totalDownloads } : prev);
    } catch {}
    window.open("https://github.com/Dxtobi/recieptflow/releases/download/latest/ReceiptFlow.apk", "_blank");
  };

  // WhatsApp share generator - share as image
  const shareWhatsAppImage = async () => {
    if (!previewReceipt) return;
    setIsExporting(true);
    try {
      const target = document.getElementById("printable-receipt");
      if (!target) { setIsExporting(false); return; }

      await Promise.all(
        Array.from(target.querySelectorAll("img")).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
        )
      );
      await new Promise(r => setTimeout(r, 300));

      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "600px";
      clone.style.overflow = "visible";
      clone.style.aspectRatio = "auto";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 600,
        height: clone.scrollHeight,
        windowWidth: 600,
        windowHeight: clone.scrollHeight,
      });
      document.body.removeChild(clone);

      const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      if (!imageBlob) { setIsExporting(false); return; }

      const file = new File([imageBlob], `Receipt-${previewReceipt.receiptNumber}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Receipt ${previewReceipt.receiptNumber}` });
      } else {
        const url = URL.createObjectURL(imageBlob);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Receipt ${previewReceipt.receiptNumber}`)}`;
        window.open(whatsappUrl, "_blank");
        const link = document.createElement("a");
        link.download = `Receipt-${previewReceipt.receiptNumber}.png`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error("WhatsApp image share failed", err);
      const itemsText = previewReceipt.items.map(item => `• ${item.name} (${item.quantity}x)`).join("\n");
      const text = `🧾 *RECEIPT ${previewReceipt.receiptNumber}*\n\n*Billed To:* ${previewReceipt.customerName}\n*Date:* ${previewReceipt.issueDate}\n\n*Items:*\n${itemsText}\n\n*Total Amount:* ${store.businessProfile.currency}${previewReceipt.total.toFixed(2)}\n*Payment Method:* ${previewReceipt.paymentMethod}\n*Payment Status:* ${previewReceipt.paymentStatus.toUpperCase()}\n\nThank you for doing business with ${store.businessProfile.name || "us"}!`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, "_blank");
    } finally {
      setIsExporting(false);
    }
  };

  const promptProAuth = () => {
    store.logout();
    setAuthMode("register");
    setAppState("auth");
  };

  // RENDER LANDING PAGE
  if (appState === "landing") {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans flex flex-col justify-between text-zinc-800 dark:text-zinc-200 transition-colors">
        {/* Landing Header */}
        <header className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white truncate">ReceiptFlow</h1>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-mono hidden sm:block">Receipt Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 dark:text-zinc-400 transition"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button
              onClick={() => { setAuthMode("login"); setAppState("auth"); }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition whitespace-nowrap"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAppState("auth"); }}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
            >
              Register
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-800">
              <Zap className="w-3.5 h-3.5" /> Fast, Professional & Unlimited
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white leading-tight tracking-tight">
              Create and Share <span className="text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400">Professional Receipts</span> in Seconds
            </h2>
            
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-lg">
              Perfect for small businesses, freelancers, online vendors, and WhatsApp sellers. Generates clean branded layouts, calculates discounts & taxes, exports to PDF/PNG, and backs up your data instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startAsGuest}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 text-sm font-bold rounded-xl shadow-sm transition"
              >
                Try Web App <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={autofillDemo}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold rounded-xl transition"
              >
                Try Live Demo
              </button>
            </div>

            {/* Live Stats / Social Proof */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 max-w-md">
              <div>
                <h4 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {landingStats ? (landingStats.totalReceipts + 1500).toLocaleString() : "—"}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Receipts Created</p>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {landingStats ? (landingStats.totalUsers + 85).toLocaleString() : "—"}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Active Users</p>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {landingStats ? landingStats.totalDownloads.toLocaleString() : "—"}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Downloads</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Receipt Preview Mockup */}
            <div className="w-full max-w-[420px] mx-auto bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                <div>
                  <h4 className="font-extrabold text-zinc-900 dark:text-white text-sm">Sample Receipt</h4>
                  <p className="text-[10px] text-zinc-400">Classic Layout Preview</p>
                </div>
              </div>
              
              <div className="text-zinc-700 dark:text-zinc-300 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Receipt No:</span>
                  <span className="font-bold">RF-2026-892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Customer:</span>
                  <span className="font-bold">Starlight Ventures</span>
                </div>
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 my-2 pt-2"></div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>1x UI Design Retainer</span>
                    <span className="font-bold">$2,500.00</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>15x Web Dev consulting</span>
                    <span className="font-bold">$1,800.00</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 my-2 pt-2"></div>
                <div className="flex justify-between text-sm font-extrabold">
                  <span>Grand Total:</span>
                  <span className="text-zinc-950 dark:text-zinc-100">$4,300.00</span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <div className="text-center border-t border-zinc-200 dark:border-zinc-800 w-24 pt-1">
                  <p className="font-serif italic text-xs text-zinc-800 dark:text-zinc-200">Alex River</p>
                  <p className="text-[8px] uppercase tracking-wider text-zinc-400">Authorized Sign</p>
                </div>
              </div>
            </div>

            {/* Download App Section */}
            <div className="w-full max-w-[420px] mx-auto bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h3 className="font-extrabold text-zinc-900 dark:text-white text-sm">Get the Mobile App</h3>
              <p className="text-xs text-zinc-500">Download the Android app for offline receipt creation on the go.</p>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-sm font-bold rounded-xl shadow-sm transition"
              >
                <Download className="w-4 h-4" /> Download for Android
              </button>
              <p className="text-[10px] text-zinc-400 text-center">iOS coming soon</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-400 py-6 border-t border-zinc-200 dark:border-zinc-800 max-w-7xl mx-auto w-full space-y-1">
          <p>© 2026 ReceiptFlow — Simple, fast receipt generation for small businesses.</p>
          <p className="text-[10px]">Built with React • MongoDB • Capacitor</p>
        </footer>
      </div>
    );
  }

  // RENDER AUTHENTICATION PAGE
  if (appState === "auth") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex items-center justify-center p-6 text-zinc-800 dark:text-zinc-100 transition-colors">
        <div className="w-full max-w-md space-y-6">
          
          <div className="text-center space-y-2">
            <div 
              onClick={() => setAppState("landing")}
              className="inline-flex cursor-pointer items-center justify-center w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-2xl text-white dark:text-zinc-950 shadow-sm mx-auto hover:scale-105 transition"
            >
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {authMode === "login" ? "Welcome Back" : "Create Account Free"}
            </h2>
            <p className="text-xs text-zinc-500">
              {authMode === "login" 
                ? "Sign in to access your saved receipts and clients database" 
                : "Register in seconds. No credit card required."
              }
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-100 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={authMode === "login" ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. business@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={store.isLoading}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {store.isLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                <span>{authMode === "login" ? "Sign In Now" : "Register Free"}</span>
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Or</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            <button
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
                const authUrl = `${apiBase}/api/auth/google`;
                window.location.href = authUrl;
              }}
              className="w-full py-2.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[11px] font-bold text-zinc-900 border border-zinc-200">G</span>
              Sign in with Google
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Quick Fill Demo</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            <button
              onClick={autofillDemo}
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-750 dark:text-zinc-200 text-xs font-bold rounded-xl transition"
            >
              Autofill Pro Demo Credentials
            </button>
          </div>

          <div className="text-center space-y-1 text-xs">
            <p className="text-zinc-500">
              {authMode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                className="text-zinc-900 dark:text-zinc-100 font-bold ml-1 hover:underline"
              >
                {authMode === "login" ? "Register Free" : "Sign In"}
              </button>
            </p>
            <button
              onClick={() => isNativeApp() ? setAppState("workspace") : setAppState("landing")}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ← {isNativeApp() ? "Back to Dashboard" : "Back to home page"}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // RENDER WORKSPACE PAGE (Main Application Shell)
  const isRegisteredUser = store.user !== null;
  const currencySymbol = store.businessProfile.currency || "$";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans flex text-zinc-800 dark:text-zinc-100 transition-colors">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 flex flex-col justify-between transform md:translate-x-0 ${
        showMobileSidebar ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-200 md:relative md:flex shrink-0`}>
        
        <div className="p-3 sm:p-5 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-zinc-950">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white">ReceiptFlow</h1>
                <p className="text-[8px] text-zinc-400 font-mono uppercase tracking-wider">WORKSPACE</p>
              </div>
            </div>

            <button
              onClick={() => setShowMobileSidebar(false)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-400 md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 mb-3 flex items-center justify-between">
              <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider text-zinc-400">
                Navigation
              </span>
            </div>

            {/* Create Receipt */}
            <button
              onClick={() => { setActiveTab("create"); setShowMobileSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "create"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <PlusCircle className="w-4 h-4 text-zinc-400" />
              <span>Create Receipt</span>
            </button>

            {/* Receipt History */}
            <button
              onClick={() => { setActiveTab("history"); setShowMobileSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "history"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <History className="w-4 h-4 text-zinc-400" />
              <span>Receipt History</span>
              <span className="ml-auto text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded-full font-bold">
                {store.receipts.length}
              </span>
            </button>

            {/* Dashboard */}
            <button
              onClick={() => {
                if (!isRegisteredUser) { setAuthMode("login"); setAppState("auth"); return; }
                setActiveTab("dashboard");
                setShowMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "dashboard"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
              <span>Dashboard Analytics</span>
              {!isRegisteredUser && <span className="ml-auto text-[9px] text-zinc-400 font-normal">Sign in</span>}
            </button>

            {/* Customers */}
            <button
              onClick={() => {
                if (!isRegisteredUser) { setAuthMode("login"); setAppState("auth"); return; }
                setActiveTab("customers");
                setShowMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "customers"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Customers Directory</span>
              {!isRegisteredUser && <span className="ml-auto text-[9px] text-zinc-400 font-normal">Sign in</span>}
            </button>

            {/* Products */}
            <button
              onClick={() => {
                if (!isRegisteredUser) { setAuthMode("login"); setAppState("auth"); return; }
                setActiveTab("products");
                setShowMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "products"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
              <span>Products & Services</span>
              {!isRegisteredUser && <span className="ml-auto text-[9px] text-zinc-400 font-normal">Sign in</span>}
            </button>

            {/* Settings */}
            <button
              onClick={() => { setActiveTab("settings"); setShowMobileSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "settings"
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Business Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer info (User Account info & Logout) */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-900 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center font-bold text-xs uppercase">
              {isRegisteredUser ? store.user?.email.slice(0, 2) : "GS"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                {isRegisteredUser ? store.user?.email : "Guest User"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>

      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Top Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 px-3 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white capitalize flex items-center gap-1.5 min-w-0">
                <span className="truncate">{activeTab === "create" ? "New Receipt" : activeTab === "settings" ? "Settings" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
                {!isRegisteredUser && activeTab === "create" && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded font-medium">
                    GUEST {store.receipts.length}/5
                  </span>
                )}
              </h2>
          </div>

            <div className="flex items-center gap-2">
              {!isRegisteredUser && (
                <button
                  onClick={() => { setAuthMode("login"); setAppState("auth"); }}
                  className="md:hidden px-3 py-1.5 text-[10px] font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg transition"
                >
                  Sign In
                </button>
              )}
            <button
              onClick={toggleTheme}
              className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg transition"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="hidden sm:block text-right">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[160px]">
                {store.businessProfile.name || "My Business"}
              </h4>
              <p className="text-[9px] text-zinc-400">
                RF • {store.businessProfile.currency || "$"}
              </p>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 max-w-5xl w-full mx-auto">
          
          {/* Redirect guests trying to access registered-only tabs */}
          {["dashboard", "customers", "products"].includes(activeTab) && !isRegisteredUser && (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
              <ShieldAlert className="w-12 h-12 text-zinc-300 mb-3" />
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200">Sign in to access this feature</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
                Create a free account or sign in to use the Dashboard, Customers, and Products.
              </p>
              <button
                onClick={promptProAuth}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl transition"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {activeTab === "dashboard" && isRegisteredUser && (
            <Dashboard
              stats={store.dashboardStats}
              receipts={store.receipts}
              currencySymbol={currencySymbol}
              onSelectReceipt={(r) => setPreviewReceipt(r)}
              onNavigateToReceipts={() => setActiveTab("history")}
            />
          )}

          {activeTab === "create" && (
            <ReceiptForm
              initialReceipt={store.activeReceipt}
              customers={store.customers}
              products={store.products}
              currencySymbol={currencySymbol}
              businessProfile={store.businessProfile}
              onSave={handleSaveReceipt}
              onPreview={(r) => setPreviewReceipt(r)}
              isRegisteredUser={isRegisteredUser}
            />
          )}

          {activeTab === "history" && (
            <HistoryList
              receipts={store.receipts}
              currencySymbol={currencySymbol}
              onSelect={(r) => setPreviewReceipt(r)}
              onEdit={handleEditReceiptClick}
              onDuplicate={handleDuplicateReceiptClick}
              onDelete={handleDeleteReceiptClick}
              isRegisteredUser={isRegisteredUser}
              onPromptAuth={promptProAuth}
            />
          )}

          {activeTab === "customers" && isRegisteredUser && (
            <CustomerManager
              customers={store.customers}
              onAdd={store.addCustomer}
              isRegisteredUser={isRegisteredUser}
            />
          )}

          {activeTab === "products" && isRegisteredUser && (
            <ProductManager
              products={store.products}
              onAdd={store.addProduct}
              currencySymbol={currencySymbol}
              isRegisteredUser={isRegisteredUser}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              initialProfile={store.businessProfile}
              onSaveProfile={store.updateBusinessProfile}
              isRegisteredUser={isRegisteredUser}
              onPromptAuth={promptProAuth}
            />
          )}

        </main>
      </div>

      {/* Full Screen Receipt Preview Modal Overlay */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto select-none print:p-0 print:bg-white print:z-0">
          
          {/* Main Sheet */}
          <div className="bg-zinc-100 dark:bg-zinc-950 w-full max-w-5xl rounded-3xl flex flex-col md:flex-row shadow-2xl h-[90vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 print:h-auto print:border-none print:shadow-none print:rounded-none">
            
            {/* Left Preview Box */}
            <div className="flex-1 overflow-y-auto p-3 md:p-8 flex justify-center bg-zinc-200/40 dark:bg-zinc-900/40 print:p-0 print:bg-white">
              <div className="w-full max-w-[700px] h-fit">
                <ReceiptPreview
                  receipt={previewReceipt}
                  businessProfile={store.businessProfile}
                  isRegisteredUser={isRegisteredUser}
                />
              </div>
            </div>

            {/* Right Control Actions Panel */}
            <div className="w-full md:w-80 bg-white dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 flex flex-col justify-between shrink-0 print:hidden">
              
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Export Options</h3>
                    <p className="text-[10px] text-zinc-500">Save, print, or share your invoice</p>
                  </div>

                  <button
                    onClick={() => setPreviewReceipt(null)}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative py-1">
                  <div className="border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>

                {/* Main Action Buttons */}
                <div className="space-y-2">
                  
                  {/* PRINT / Native PDF Download */}
                  <button
                    onClick={triggerPrint}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" /> Print / Save as PDF
                  </button>

                  {/* Export as PNG */}
                  <button
                    disabled={isExporting}
                    onClick={() => exportAsImage("png")}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Download as PNG Image</span>
                  </button>

                  {/* WhatsApp Share option */}
                  <button
                    onClick={shareWhatsAppImage}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold rounded-xl transition"
                  >
                    <Share2 className="w-4 h-4" /> Share on WhatsApp
                  </button>

                </div>
              </div>

              {/* Information footer inside Preview side panel */}
              <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-500 space-y-1 mt-4">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">💡 Quick Hint:</p>
                <p>Selecting **'Print / Save as PDF'** allows you to save this invoice as a vector PDF document using your browser's PDF options.</p>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
