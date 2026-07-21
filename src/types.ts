export interface BusinessProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  bankDetails: string;
  signature: string;
  currency: string;
  logo: string;
  stamp: string;
}

export interface Customer {
  customerId: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  productId: string;
  userId: string;
  name: string;
  price: number;
  sku: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Receipt {
  receiptId?: string;
  userId?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  receiptNumber: string;
  issueDate: string;
  dueDate?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number; // percentage or fixed? Let's use percentage, displayed nicely
  discount: number; // raw value
  shipping: number; // raw value
  total: number;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "overdue";
  notes: string;
  templateStyle?: "classic" | "modern" | "minimal" | "thermal";
  createdAt?: string;
}

export interface User {
  uid: string;
  email: string;
  subscription: string;
  businessProfile: BusinessProfile;
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  receiptCount: number;
  revenue: number;
  topCustomers: Array<{ name: string; total: number }>;
}
