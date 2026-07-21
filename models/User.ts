import mongoose, { Schema, Document } from "mongoose";

export interface IBusinessProfile {
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

export interface IUser extends Document {
  uid: string;
  email: string;
  password: string;
  subscription: string;
  businessProfile: IBusinessProfile;
  createdAt: string;
}

const BusinessProfileSchema = new Schema<IBusinessProfile>(
  {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    website: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    signature: { type: String, default: "" },
    currency: { type: String, default: "$" },
    logo: { type: String, default: "" },
    stamp: { type: String, default: "" },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, default: "free" },
  businessProfile: { type: BusinessProfileSchema, default: () => ({}) },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
