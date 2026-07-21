import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  customerId: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

const CustomerSchema = new Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
});

export const CustomerModel = mongoose.model<ICustomer>("Customer", CustomerSchema);
