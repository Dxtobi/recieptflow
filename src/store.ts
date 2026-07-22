import { create } from "zustand";
import { User, BusinessProfile, Customer, Product, Receipt, DashboardStats } from "./types";
import { generateReceiptNumber } from "./utils";

const API_BASE = import.meta.env.VITE_API_URL || "";

function api(path: string, options?: RequestInit) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
}

interface AppState {
  user: User | null;
  isGuest: boolean;
  businessProfile: BusinessProfile;
  customers: Customer[];
  products: Product[];
  receipts: Receipt[];
  dashboardStats: DashboardStats | null;
  activeReceipt: Receipt;
  isLoading: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  setGuestMode: (enabled: boolean) => void;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => Promise<boolean>;
  
  // Customers Actions
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, "customerId" | "userId">) => Promise<Customer | null>;
  
  // Products Actions
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, "productId" | "userId">) => Promise<Product | null>;
  
  // Receipts Actions
  fetchReceipts: () => Promise<void>;
  addReceipt: (receipt: Receipt) => Promise<Receipt | null>;
  updateReceipt: (receiptId: string, receipt: Partial<Receipt>) => Promise<boolean>;
  deleteReceipt: (receiptId: string) => Promise<boolean>;
  fetchDashboardStats: () => Promise<void>;
  
  // Receipt Creation Form States
  setActiveReceipt: (receipt: Receipt) => void;
  resetActiveReceipt: () => void;
}

const defaultBusinessProfile: BusinessProfile = {
  name: "",
  phone: "",
  email: "",
  address: "",
  website: "",
  bankDetails: "",
  signature: "",
  currency: "$",
  logo: "",
  stamp: ""
};

const defaultReceipt = (): Receipt => ({
  receiptNumber: generateReceiptNumber("RF"),
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: "",
  items: [{ name: "", quantity: 1, price: 0, total: 0 }],
  subtotal: 0,
  tax: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  paymentMethod: "Cash",
  paymentStatus: "pending",
  notes: "Thank you for your business!",
  templateStyle: "classic"
});

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isGuest: false,
  businessProfile: defaultBusinessProfile,
  customers: [],
  products: [],
  receipts: [],
  dashboardStats: null,
  activeReceipt: defaultReceipt(),
  isLoading: false,
  error: null,

  init: async () => {
    // Attempt to restore user session from localStorage
    const savedUser = localStorage.getItem("rf_user");
    const savedIsGuest = localStorage.getItem("rf_isGuest");
    
    if (savedUser) {
      const user = JSON.parse(savedUser) as User;
      set({ user, isGuest: false, businessProfile: user.businessProfile });
      // Fetch user data
      await get().fetchCustomers();
      await get().fetchProducts();
      await get().fetchReceipts();
      await get().fetchDashboardStats();
    } else if (savedIsGuest === "true") {
      // Guest mode session recovery
      const savedReceipts = localStorage.getItem("rf_guest_receipts");
      const savedProfile = localStorage.getItem("rf_guest_profile");
      const savedCustomers = localStorage.getItem("rf_guest_customers");
      const savedProducts = localStorage.getItem("rf_guest_products");
      set({ 
        isGuest: true,
        receipts: savedReceipts ? JSON.parse(savedReceipts) : [],
        customers: savedCustomers ? JSON.parse(savedCustomers) : [],
        products: savedProducts ? JSON.parse(savedProducts) : [],
        businessProfile: savedProfile ? JSON.parse(savedProfile) : { ...defaultBusinessProfile, name: "My Business" }
      });
      await get().fetchDashboardStats();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed");
      }
      const user = await res.json() as User;
      set({ user, isGuest: false, businessProfile: user.businessProfile, isLoading: false });
      localStorage.setItem("rf_user", JSON.stringify(user));
      localStorage.removeItem("rf_isGuest");

      // Fetch user data
      await get().fetchCustomers();
      await get().fetchProducts();
      await get().fetchReceipts();
      await get().fetchDashboardStats();
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Registration failed");
      }
      const user = await res.json() as User;
      set({ user, isGuest: false, businessProfile: user.businessProfile, isLoading: false });
      localStorage.setItem("rf_user", JSON.stringify(user));
      localStorage.removeItem("rf_isGuest");
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    set({ 
      user: null, 
      isGuest: false, 
      businessProfile: defaultBusinessProfile, 
      customers: [], 
      products: [], 
      receipts: [],
      dashboardStats: null,
      activeReceipt: defaultReceipt()
    });
    localStorage.removeItem("rf_user");
    localStorage.removeItem("rf_isGuest");
    localStorage.removeItem("rf_guest_receipts");
  },

  setUser: (user) => {
    set({ user, isGuest: false, businessProfile: user.businessProfile });
    localStorage.setItem("rf_user", JSON.stringify(user));
    localStorage.removeItem("rf_isGuest");
  },

  setGuestMode: (enabled) => {
    if (enabled) {
      const savedProfile = localStorage.getItem("rf_guest_profile");
      const savedReceipts = localStorage.getItem("rf_guest_receipts");
      const savedCustomers = localStorage.getItem("rf_guest_customers");
      const savedProducts = localStorage.getItem("rf_guest_products");
      set({ 
        isGuest: true, 
        user: null, 
        businessProfile: savedProfile ? JSON.parse(savedProfile) : { ...defaultBusinessProfile, name: "My Business" },
        receipts: savedReceipts ? JSON.parse(savedReceipts) : [],
        customers: savedCustomers ? JSON.parse(savedCustomers) : [],
        products: savedProducts ? JSON.parse(savedProducts) : []
      });
      localStorage.setItem("rf_isGuest", "true");
      localStorage.removeItem("rf_user");
      get().fetchDashboardStats();
    } else {
      set({ isGuest: false });
      localStorage.removeItem("rf_isGuest");
    }
  },

  updateBusinessProfile: async (profile) => {
    const { user, isGuest, businessProfile } = get();
    const updatedProfile = { ...businessProfile, ...profile };
    
    if (isGuest) {
      set({ businessProfile: updatedProfile });
      localStorage.setItem("rf_guest_profile", JSON.stringify(updatedProfile));
      return true;
    }

    if (!user) return false;
    set({ isLoading: true });
    try {
      const res = await api("/api/business/profile", {
        method: "POST",
        body: JSON.stringify({ userId: user.uid, businessProfile: updatedProfile })
      });
      if (!res.ok) throw new Error("Failed to update business profile");
      
      const updatedUser = { ...user, businessProfile: updatedProfile };
      set({ user: updatedUser, businessProfile: updatedProfile, isLoading: false });
      localStorage.setItem("rf_user", JSON.stringify(updatedUser));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  fetchCustomers: async () => {
    const { user, isGuest } = get();
    if (isGuest || !user) return;
    try {
      const res = await api(`/api/customers?userId=${user.uid}`);
      if (res.ok) {
        const customers = await res.json();
        set({ customers });
      }
    } catch (e) {
      console.error("Error fetching customers", e);
    }
  },

  addCustomer: async (customer) => {
    const { user, isGuest, customers } = get();
    if (isGuest) {
      const newCustomer: Customer = {
        customerId: "cust_" + Math.random().toString(36).substr(2, 9),
        userId: "guest",
        ...customer
      };
      const updated = [...customers, newCustomer];
      set({ customers: updated });
      localStorage.setItem("rf_guest_customers", JSON.stringify(updated));
      return newCustomer;
    }
    if (!user) return null;
    try {
      const res = await api("/api/customers", {
        method: "POST",
        body: JSON.stringify({ userId: user.uid, ...customer })
      });
      if (res.ok) {
        const newCustomer = await res.json();
        set({ customers: [...customers, newCustomer] });
        return newCustomer;
      }
    } catch (e) {
      console.error("Error adding customer", e);
    }
    return null;
  },

  fetchProducts: async () => {
    const { user, isGuest } = get();
    if (isGuest || !user) return;
    try {
      const res = await api(`/api/products?userId=${user.uid}`);
      if (res.ok) {
        const products = await res.json();
        set({ products });
      }
    } catch (e) {
      console.error("Error fetching products", e);
    }
  },

  addProduct: async (product) => {
    const { user, isGuest, products } = get();
    if (isGuest) {
      const newProduct: Product = {
        productId: "prod_" + Math.random().toString(36).substr(2, 9),
        userId: "guest",
        ...product
      };
      const updated = [...products, newProduct];
      set({ products: updated });
      localStorage.setItem("rf_guest_products", JSON.stringify(updated));
      return newProduct;
    }
    if (!user) return null;
    try {
      const res = await api("/api/products", {
        method: "POST",
        body: JSON.stringify({ userId: user.uid, ...product })
      });
      if (res.ok) {
        const newProduct = await res.json();
        set({ products: [...products, newProduct] });
        return newProduct;
      }
    } catch (e) {
      console.error("Error adding product", e);
    }
    return null;
  },

  fetchReceipts: async () => {
    const { user, isGuest } = get();
    if (isGuest || !user) return;
    try {
      const res = await api(`/api/receipts?userId=${user.uid}`);
      if (res.ok) {
        const receipts = await res.json();
        set({ receipts });
      }
    } catch (e) {
      console.error("Error fetching receipts", e);
    }
  },

  addReceipt: async (receipt) => {
    const { user, isGuest, receipts } = get();
    if (isGuest) {
      const newReceipt: Receipt = {
        ...receipt,
        receiptId: "rec_" + Math.random().toString(36).substr(2, 9),
        userId: "guest",
        createdAt: new Date().toISOString()
      };
      const updated = [newReceipt, ...receipts];
      set({ receipts: updated });
      localStorage.setItem("rf_guest_receipts", JSON.stringify(updated));
      await get().fetchDashboardStats();
      return newReceipt;
    }
    if (!user) return null;
    try {
      const res = await api("/api/receipts", {
        method: "POST",
        body: JSON.stringify({ userId: user.uid, ...receipt })
      });
      if (res.ok) {
        const newReceipt = await res.json();
        set({ receipts: [newReceipt, ...receipts] });
        await get().fetchDashboardStats();
        return newReceipt;
      }
    } catch (e) {
      console.error("Error adding receipt", e);
    }
    return null;
  },

  updateReceipt: async (receiptId, receipt) => {
    const { user, isGuest, receipts } = get();
    if (isGuest) {
      const updated = receipts.map((r) => 
        r.receiptId === receiptId ? { ...r, ...receipt } : r
      );
      set({ receipts: updated });
      localStorage.setItem("rf_guest_receipts", JSON.stringify(updated));
      await get().fetchDashboardStats();
      return true;
    }
    if (!user) return false;
    try {
      const res = await api(`/api/receipts/${receiptId}`, {
        method: "PUT",
        body: JSON.stringify({ userId: user.uid, ...receipt })
      });
      if (res.ok) {
        const updatedReceipt = await res.json();
        set({
          receipts: receipts.map((r) => r.receiptId === receiptId ? updatedReceipt : r)
        });
        await get().fetchDashboardStats();
        return true;
      }
    } catch (e) {
      console.error("Error updating receipt", e);
    }
    return false;
  },

  deleteReceipt: async (receiptId) => {
    const { user, isGuest, receipts } = get();
    if (isGuest) {
      const updated = receipts.filter((r) => r.receiptId !== receiptId);
      set({ receipts: updated });
      localStorage.setItem("rf_guest_receipts", JSON.stringify(updated));
      await get().fetchDashboardStats();
      return true;
    }
    if (!user) return false;
    try {
      const res = await api(`/api/receipts/${receiptId}?userId=${user.uid}`, {
        method: "DELETE"
      });
      if (res.ok) {
        set({ receipts: receipts.filter((r) => r.receiptId !== receiptId) });
        await get().fetchDashboardStats();
        return true;
      }
    } catch (e) {
      console.error("Error deleting receipt", e);
    }
    return false;
  },

  fetchDashboardStats: async () => {
    const { user, isGuest } = get();
    if (isGuest) {
      const receipts = get().receipts;
      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      let todaySales = 0;
      let monthlySales = 0;
      let revenue = 0;
      const customerSales: Record<string, number> = {};
      receipts.forEach(r => {
        const amount = Number(r.total) || 0;
        if (r.paymentStatus === 'paid') revenue += amount;
        if (r.issueDate === todayStr) todaySales += amount;
        if (r.issueDate && r.issueDate.startsWith(currentMonthStr)) monthlySales += amount;
        if (r.customerName) customerSales[r.customerName] = (customerSales[r.customerName] || 0) + amount;
      });
      const topCustomers = Object.entries(customerSales)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      set({ dashboardStats: { todaySales, monthlySales, receiptCount: receipts.length, revenue, topCustomers } });
      return;
    }
    if (!user) return;
    try {
      const res = await api(`/api/dashboard?userId=${user.uid}`);
      if (res.ok) {
        const dashboardStats = await res.json();
        set({ dashboardStats });
      }
    } catch (e) {
      console.error("Error fetching dashboard statistics", e);
    }
  },

  setActiveReceipt: (receipt) => set({ activeReceipt: receipt }),
  resetActiveReceipt: () => set({ activeReceipt: defaultReceipt() })
}));
