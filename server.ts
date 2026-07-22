import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";
import { UserModel, CustomerModel, ProductModel, ReceiptModel, StatsModel } from "./models";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/receiptflow";

app.use(express.json());

function uid(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).substr(2, 9);
}

async function seedDemoData() {
  const existing = await UserModel.findOne({ uid: "demo-user" });
  if (existing) return;

  const demoUserId = "demo-user";

  await UserModel.create({
    uid: demoUserId,
    email: "demo@receiptflow.com",
    password: "password",
    subscription: "pro",
    businessProfile: {
      name: "PixelCraft Studios",
      phone: "+1 (555) 019-2834",
      email: "billing@pixelcraft.io",
      address: "100 Innovation Way, Suite 400, San Francisco, CA 94107",
      website: "www.pixelcraft.io",
      bankDetails: "Chase Bank, Acct: ****8921, Routing: ****0210",
      signature: "Alex River",
      currency: "$",
      logo: "",
      stamp: "",
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const c1 = "cust-1";
  const c2 = "cust-2";
  const c3 = "cust-3";

  await CustomerModel.insertMany([
    { customerId: c1, userId: demoUserId, name: "Acme Corporation", phone: "+1 (555) 123-4567", email: "finance@acme.com", address: "500 Enterprise Pkwy, Chicago, IL" },
    { customerId: c2, userId: demoUserId, name: "Starlight Ventures", phone: "+1 (555) 987-6543", email: "hello@starlight.vc", address: "12 Marina Blvd, San Francisco, CA" },
    { customerId: c3, userId: demoUserId, name: "Liam Thompson (Freelance)", phone: "+1 (555) 456-7890", email: "liam@thompson.design", address: "782 Oak St, Portland, OR" },
  ]);

  await ProductModel.insertMany([
    { productId: "prod-1", userId: demoUserId, name: "UI/UX Design Retainer", price: 2500, sku: "UI-RET" },
    { productId: "prod-2", userId: demoUserId, name: "Web Development (Hourly)", price: 120, sku: "DEV-HR" },
    { productId: "prod-3", userId: demoUserId, name: "Cloud Migration Consulting", price: 1500, sku: "CLOUD-MIG" },
    { productId: "prod-4", userId: demoUserId, name: "SEO Audit & Strategy", price: 850, sku: "SEO-AUD" },
  ]);

  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);

  await ReceiptModel.insertMany([
    {
      receiptId: "rec-1", userId: demoUserId, customerId: c1, customerName: "Acme Corporation",
      receiptNumber: "RF-2026-001", issueDate: yesterday.toISOString().split('T')[0],
      items: [{ name: "UI/UX Design Retainer", quantity: 1, price: 2500, total: 2500 },
              { name: "Web Development (Hourly)", quantity: 15, price: 120, total: 1800 }],
      subtotal: 4300, tax: 215, discount: 200, shipping: 50, total: 4365,
      paymentStatus: "paid", paymentMethod: "Bank Transfer",
      createdAt: yesterday.toISOString(),
      notes: "Thank you for partnering with PixelCraft Studios. We appreciate your prompt payment!",
    },
    {
      receiptId: "rec-2", userId: demoUserId, customerId: c2, customerName: "Starlight Ventures",
      receiptNumber: "RF-2026-002", issueDate: today.toISOString().split('T')[0],
      items: [{ name: "Cloud Migration Consulting", quantity: 1, price: 1500, total: 1500 }],
      subtotal: 1500, tax: 75, discount: 0, shipping: 0, total: 1575,
      paymentStatus: "pending", paymentMethod: "Credit Card",
      createdAt: today.toISOString(),
      notes: "Invoice for Phase 1 Migration. Payment is due within 7 days.",
    },
    {
      receiptId: "rec-3", userId: demoUserId, customerId: c3, customerName: "Liam Thompson (Freelance)",
      receiptNumber: "RF-2026-003", issueDate: lastWeek.toISOString().split('T')[0],
      items: [{ name: "SEO Audit & Strategy", quantity: 1, price: 850, total: 850 },
              { name: "Web Development (Hourly)", quantity: 5, price: 120, total: 600 }],
      subtotal: 1450, tax: 0, discount: 100, shipping: 0, total: 1350,
      paymentStatus: "paid", paymentMethod: "PayPal",
      createdAt: lastWeek.toISOString(),
      notes: "Standard web maintenance and audit package.",
    },
    {
      receiptId: "rec-4", userId: demoUserId, customerId: c1, customerName: "Acme Corporation",
      receiptNumber: "RF-2026-004", issueDate: twoWeeksAgo.toISOString().split('T')[0],
      items: [{ name: "UI/UX Design Retainer", quantity: 1, price: 2500, total: 2500 }],
      subtotal: 2500, tax: 125, discount: 0, shipping: 0, total: 2625,
      paymentStatus: "overdue", paymentMethod: "Bank Transfer",
      createdAt: twoWeeksAgo.toISOString(),
      notes: "Overdue notice. Please settle as soon as possible.",
    },
  ]);

  const existingStats = await StatsModel.findOne();
  if (!existingStats) {
    const receiptCount = await ReceiptModel.countDocuments();
    const userCount = await UserModel.countDocuments();
    await StatsModel.create({
      totalReceipts: receiptCount,
      totalUsers: userCount,
      totalDownloads: 0,
    });
  }
}

// Authentication
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists with this email" });
  }

  const newUser = await UserModel.create({
    uid: uid("user"),
    email: email.toLowerCase(),
    password,
    subscription: "free",
    businessProfile: {
      name: "", phone: "", email: email.toLowerCase(),
      address: "", website: "", bankDetails: "",
      signature: "", currency: "$", logo: "", stamp: "",
    },
    createdAt: new Date().toISOString(),
  });

  await StatsModel.updateOne({}, { $inc: { totalUsers: 1 } }, { upsert: true });

  const { password: _, ...userWithoutPassword } = newUser.toObject();
  res.status(201).json(userWithoutPassword);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await UserModel.findOne({
    email: email.toLowerCase(),
    password,
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  await StatsModel.updateOne({}, { $inc: { totalReceipts: 1 } }, { upsert: true });

  const { password: _, ...userWithoutPassword } = user.toObject();
  res.json(userWithoutPassword);
});

// Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-prod";

function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

app.get("/api/auth/google", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !code) {
    return res.redirect(`${APP_URL}?auth_error=${error || "access_denied"}`);
  }

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) {
      return res.redirect(`${APP_URL}?auth_error=token_exchange_failed`);
    }

    // Decode the Google ID token to get user info
    const payloadBase64 = tokens.id_token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    const googleEmail = payload.email?.toLowerCase();
    const googleName = payload.name || googleEmail?.split("@")[0] || "User";

    if (!googleEmail) {
      return res.redirect(`${APP_URL}?auth_error=no_email`);
    }

    // Find or create user
    let user = await UserModel.findOne({ email: googleEmail });
    if (!user) {
      user = await UserModel.create({
        uid: `user_${crypto.randomBytes(4).toString("hex")}`,
        email: googleEmail,
        password: crypto.randomBytes(16).toString("hex"),
        subscription: "free",
        businessProfile: {
          name: googleName, phone: "", email: googleEmail,
          address: "", website: "", bankDetails: "",
          signature: "", currency: "$", logo: "", stamp: "",
        },
        createdAt: new Date().toISOString(),
      });
      await StatsModel.updateOne({}, { $inc: { totalUsers: 1 } }, { upsert: true });
    }

    const { password: _, ...safeUser } = user.toObject();
    const token = generateToken({ uid: safeUser.uid, email: safeUser.email });
    res.redirect(`${APP_URL}?token=${token}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.redirect(`${APP_URL}?auth_error=server_error`);
  }
});

app.post("/api/auth/google/token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string };
    const user = await UserModel.findOne({ uid: decoded.uid });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = user.toObject();
    res.json(safeUser);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// Business Profile
app.post("/api/business/profile", async (req, res) => {
  const { userId, businessProfile } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const user = await UserModel.findOne({ uid: userId });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const currentProfile = JSON.parse(JSON.stringify(user.businessProfile));
  user.businessProfile = { ...currentProfile, ...businessProfile };
  await user.save();

  res.json({ success: true, businessProfile: user.businessProfile });
});

// Customers
app.get("/api/customers", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const customers = await CustomerModel.find({ userId }).lean();
  res.json(customers);
});

app.post("/api/customers", async (req, res) => {
  const { userId, name, phone, email, address } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "User ID and Customer Name are required" });
  }

  const newCustomer = await CustomerModel.create({
    customerId: uid("cust"),
    userId,
    name,
    phone: phone || "",
    email: email || "",
    address: address || "",
  });

  res.status(201).json(newCustomer);
});

// Products
app.get("/api/products", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const products = await ProductModel.find({ userId }).lean();
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  const { userId, name, price, sku } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "User ID and Product Name are required" });
  }

  const newProduct = await ProductModel.create({
    productId: uid("prod"),
    userId,
    name,
    price: Number(price) || 0,
    sku: sku || "",
  });

  res.status(201).json(newProduct);
});

// Receipts
app.get("/api/receipts", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const receipts = await ReceiptModel.find({ userId }).sort({ issueDate: -1 }).lean();
  res.json(receipts);
});

app.post("/api/receipts", async (req, res) => {
  const {
    userId, customerId, customerName, receiptNumber, issueDate,
    items, subtotal, tax, discount, shipping, total,
    paymentStatus, paymentMethod, notes, templateStyle,
  } = req.body;

  if (!userId || !receiptNumber || !customerName) {
    return res.status(400).json({ error: "User ID, Receipt Number, and Customer Name are required" });
  }

  const newReceipt = await ReceiptModel.create({
    receiptId: uid("rec"),
    userId,
    customerId: customerId || "",
    customerName,
    receiptNumber,
    issueDate: issueDate || new Date().toISOString().split('T')[0],
    items: items || [],
    subtotal: Number(subtotal) || 0,
    tax: Number(tax) || 0,
    discount: Number(discount) || 0,
    shipping: Number(shipping) || 0,
    total: Number(total) || 0,
    paymentStatus: paymentStatus || "pending",
    paymentMethod: paymentMethod || "Cash",
    createdAt: new Date().toISOString(),
    notes: notes || "",
    templateStyle: templateStyle || "classic",
  });

  await StatsModel.updateOne({}, { $inc: { totalReceipts: 1 } }, { upsert: true });

  res.status(201).json(newReceipt);
});

app.put("/api/receipts/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const receipt = await ReceiptModel.findOne({ receiptId: id, userId });
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  Object.assign(receipt, req.body, { receiptId: id, userId });
  await receipt.save();

  res.json(receipt);
});

app.delete("/api/receipts/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const result = await ReceiptModel.deleteOne({ receiptId: id, userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json({ success: true });
});

// Dashboard
app.get("/api/dashboard", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const receipts = await ReceiptModel.find({ userId }).lean();

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  let todaySales = 0;
  let monthlySales = 0;
  let totalRevenue = 0;
  const customerSales: Record<string, number> = {};

  for (const r of receipts) {
    const amount = Number(r.total) || 0;
    if (r.paymentStatus === "paid") totalRevenue += amount;
    if (r.issueDate === todayStr) todaySales += amount;
    if (r.issueDate?.startsWith(currentMonthStr)) monthlySales += amount;
    if (r.customerName) {
      customerSales[r.customerName] = (customerSales[r.customerName] || 0) + amount;
    }
  }

  const topCustomers = Object.entries(customerSales)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  res.json({
    todaySales,
    monthlySales,
    receiptCount: receipts.length,
    revenue: totalRevenue,
    topCustomers,
  });
});

// Global Stats (public, no auth required)
app.get("/api/stats", async (req, res) => {
  let stats = await StatsModel.findOne();
  if (!stats) {
    const [receiptCount, userCount] = await Promise.all([
      ReceiptModel.countDocuments(),
      UserModel.countDocuments(),
    ]);
    stats = await StatsModel.create({
      totalReceipts: receiptCount,
      totalUsers: userCount,
      totalDownloads: 0,
    });
  }
  res.json(stats);
});

// Track app download
app.post("/api/track-download", async (req, res) => {
  await StatsModel.updateOne({}, { $inc: { totalDownloads: 1 } }, { upsert: true });
  const stats = await StatsModel.findOne();
  res.json({ totalDownloads: stats?.totalDownloads || 0 });
});

// Start server
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    await seedDemoData();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));

  const distPath = path.join(process.cwd(), "dist");

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("dist/index.html not found — serving API-only mode");
    app.get("*", (req, res) => {
      res.status(200).send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ReceiptFlow</title></head><body><div id="root"></div><script>fetch('/api/stats').then(r=>r.json()).then(d=>{document.getElementById('root').innerHTML='<div style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto;text-align:center"><h1>ReceiptFlow</h1><p>'+d.totalReceipts+' receipts created by '+d.totalUsers+' users</p><hr><p style="color:gray;font-size:14px">Frontend build not deployed. Run: npm run build</p></div>'})</script></body></html>`);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
