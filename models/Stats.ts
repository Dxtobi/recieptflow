import mongoose, { Schema, Document } from "mongoose";

export interface IStats extends Document {
  totalReceipts: number;
  totalUsers: number;
  totalDownloads: number;
}

const StatsSchema = new Schema<IStats>({
  totalReceipts: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  totalDownloads: { type: Number, default: 0 },
});

export const StatsModel = mongoose.model<IStats>("Stats", StatsSchema);
