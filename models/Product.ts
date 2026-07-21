import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  userId: string;
  name: string;
  price: number;
  sku: string;
}

const ProductSchema = new Schema<IProduct>({
  productId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  sku: { type: String, default: "" },
});

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
