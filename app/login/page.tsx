// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

// Point to your backend auth endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/mpesa', '/api/auth') || "http://localhost:3000/api/auth";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API_URL}/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem("auth_token", res.data.token);
                localStorage.setItem("auth_username", res.data.username);
                router.push("/"); // Redirect to dashboard
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-plaque dark:shadow-plaque-dark p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy/10 dark:bg-gold/10 text-navy dark:text-gold mb-4">
                        <Lock size={28} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-light-text dark:text-dark-text">Welcome Back</h1>
                    <p className="text-sm text-light-muted dark:text-dark-muted mt-1">Sign in to your Billiard Tracker</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-burgundy dark:text-coral text-xs flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <a href="/recover" className="text-xs font-semibold text-navy dark:text-gold hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-navy dark:bg-gold text-white dark:text-dark-bg font-display font-bold py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>
            </div>
        </main>
    );
}