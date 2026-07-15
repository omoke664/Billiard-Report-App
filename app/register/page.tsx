// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, User, Lock, KeyRound, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/mpesa', '/api/auth') || "http://localhost:3001/api/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/register`, {
                username,
                password,
                securityQuestion,
                securityAnswer,
            });

            if (res.data.success) {
                setSuccess("Account created successfully! Redirecting to login...");
                setTimeout(() => router.push("/login"), 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-plaque dark:shadow-plaque-dark p-8 animate-rise-in">
                <button onClick={() => router.push("/login")} className="flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted hover:text-navy dark:hover:text-gold mb-6 transition-colors">
                    ← Back to Login
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy/10 dark:bg-gold/10 text-navy dark:text-gold mb-4 mx-auto">
                        <UserPlus size={28} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-light-text dark:text-dark-text">Create Account</h1>
                    <p className="text-sm text-light-muted dark:text-dark-muted mt-1">Set up your Billiard Tracker</p>
                </div>

                {success ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 justify-center">
                        <CheckCircle size={18} /> {success}
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-burgundy dark:text-coral text-xs flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Username</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all" placeholder="Choose a username" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-12 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all" placeholder="Min. 6 characters" required minLength={6} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted hover:text-navy dark:hover:text-gold transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all" placeholder="Re-enter password" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Security Question</label>
                            <div className="relative">
                                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-light-muted dark:text-dark-muted" />
                                <input type="text" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all" placeholder="e.g., What is your favorite color?" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Security Answer</label>
                            <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all" placeholder="Your answer" required />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-navy dark:bg-gold text-white dark:text-dark-bg font-display font-bold py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}