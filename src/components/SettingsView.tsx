import React, { useState } from "react";
import { BusinessProfile } from "../types";
import { Save, User, FileText, Check, Moon, Sun, ShieldAlert, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeContext";

interface SettingsViewProps {
  initialProfile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
  isRegisteredUser: boolean;
  onPromptAuth: () => void;
}

export default function SettingsView({
  initialProfile,
  onSaveProfile,
  isRegisteredUser,
  onPromptAuth
}: SettingsViewProps) {
  const [profile, setProfile] = useState<BusinessProfile>(initialProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleFieldChange = (field: keyof BusinessProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Settings Navigation / Sidebar panel */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center space-y-3">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-700">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white truncate">
              {profile.name || "My Business Profile"}
            </h3>
            <p className="text-xs text-zinc-500 truncate">{profile.email || "No business email"}</p>
          </div>

          <div className="pt-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isRegisteredUser 
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" 
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              {isRegisteredUser ? "PRO REGISTERED" : "FREE GUEST"}
            </span>
          </div>
        </div>

        {/* Global Settings Block */}
        <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">App Preferences</h4>
          
          {/* Light / Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Dark Mode</p>
              <p className="text-[10px] text-zinc-500">Toggle dark visual mode</p>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition text-zinc-900 dark:text-zinc-100"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick instructions / features list */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">Default Configuration:</p>
            <p>• Prefix: **RF-**</p>
            <p>• Format: **PDF Export, thermal width**</p>
            <p>• Language: **English (Default)**</p>
          </div>
        </div>

        {/* Upgrade Banner for Guest */}
        {!isRegisteredUser && (
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-center">
            <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto" />
            <h4 className="text-xs font-extrabold uppercase text-zinc-900 dark:text-zinc-200">Sync with the Cloud</h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your guest profile and directory data are currently offline. Register a free account to sync, backup, and log in from any computer or mobile device.
            </p>
            <button
              onClick={onPromptAuth}
              className="w-full text-xs font-bold py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl transition shadow-sm"
            >
              Create Free Account
            </button>
          </div>
        )}

      </div>

      {/* Right Business Profile Edit Form */}
      <div className="lg:col-span-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white">Business Settings</h3>
            <p className="text-xs text-zinc-500">Configure your business header branding details on receipts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Business Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Business / Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. PixelCraft Studios"
                value={profile.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Default Currency Symbol</label>
              <select
                value={profile.currency}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              >
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="₦">NGN (₦)</option>
                <option value="₹">INR (₹)</option>
                <option value="¥">JPY/CNY (¥)</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Billing Email</label>
              <input
                type="email"
                placeholder="billing@domain.com"
                value={profile.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={profile.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Physical Address</label>
              <input
                type="text"
                placeholder="100 Enterprise Way, Suite 400, San Francisco, CA"
                value={profile.address}
                onChange={(e) => handleFieldChange("address", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Website URL</label>
              <input
                type="text"
                placeholder="www.mybrand.com"
                value={profile.website}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Bank Details */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Bank Payment Details <span className="text-[10px] text-zinc-400 font-normal">(Printed on receipts)</span></label>
              <textarea
                placeholder="e.g. Bank of America, Acct: ****1234, Routing: ****5678"
                value={profile.bankDetails}
                onChange={(e) => handleFieldChange("bankDetails", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Handwritten Signature and Stamp */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Signature Line <span className="text-[10px] text-zinc-400 font-normal">(E-Sign font)</span></label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={profile.signature}
                onChange={(e) => handleFieldChange("signature", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100 font-serif italic"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Stamp Mark Indicator</label>
              <select
                value={profile.stamp ? "active" : ""}
                onChange={(e) => handleFieldChange("stamp", e.target.value ? "active" : "")}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">No stamp</option>
                <option value="active">Official APPROVED Stamp</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
            <div>
              {saveSuccess && (
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Business Profile saved successfully!
                </p>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
