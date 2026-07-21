import mongoose, { Schema, Document } from "mongoose";

export interface IReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IReceipt extends Document {
  receiptId: string;
  userId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  receiptNumber: string;
  issueDate: string;
  dueDate: string;
  items: IReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "overdue";
  notes: string;
  templateStyle: "classic" | "modern" | "minimal" | "thermal";
  createdAt: string;
}

const ReceiptItemSchema = new Schema<IReceiptItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const ReceiptSchema = new Schema<IReceipt>({
  receiptId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  customerId: { type: String, default: "" },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  customerAddress: { type: String, default: "" },
  receiptNumber: { type: String, required: true },
  issueDate: { type: String, required: true },
  dueDate: { type: String, default: "" },
  items: { type: [ReceiptItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, default: "Cash" },
  paymentStatus: {
    type: String,
    enum: ["paid", "pending", "overdue"],
    default: "pending",
  },
  notes: { type: String, default: "" },
  templateStyle: {
    type: String,
    enum: ["classic", "modern", "minimal", "thermal"],
    default: "classic",
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const ReceiptModel = mongoose.model<IReceipt>("Receipt", ReceiptSchema);
