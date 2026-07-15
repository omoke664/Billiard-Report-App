// app/recover/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/mpesa', '/api/auth') || "http://localhost:3000/api/auth";

export default function RecoverPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleGetQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await axios.post(`${API_URL}/get-question`, { username });
            setSecurityQuestion(res.data.securityQuestion);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || "User not found.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecover = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await axios.post(`${API_URL}/recover-password`, { username, securityAnswer, newPassword });
            setSuccess("Password updated successfully! Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Recovery failed. Check your answer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center p-4 transition-colors">
            <div className="w-full max-w-md bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-plaque dark:shadow-plaque-dark p-8">
                <button onClick={() => router.push("/login")} className="flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted hover:text-navy dark:hover:text-gold mb-6 transition-colors">
                    <ArrowLeft size={16} /> Back to Login
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-burgundy/10 dark:bg-coral/10 text-burgundy dark:text-coral mb-4">
                        <KeyRound size={28} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-light-text dark:text-dark-text">Account Recovery</h1>
                    <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                        {step === 1 ? "Enter your username to continue" : "Answer your security question"}
                    </p>
                </div>

                {success ? (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 justify-center">
                        <CheckCircle size={18} /> {success}
                    </div>
                ) : (
                    <form onSubmit={step === 1 ? handleGetQuestion : handleRecover} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-burgundy dark:text-coral text-xs flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all"
                                    placeholder="Enter your username"
                                    required
                                />
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border dark:border-dark-border">
                                    <p className="text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1">Security Question</p>
                                    <p className="font-semibold text-light-text dark:text-dark-text">{securityQuestion}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">Your Answer</label>
                                    <input
                                        type="text"
                                        value={securityAnswer}
                                        onChange={(e) => setSecurityAnswer(e.target.value)}
                                        className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all"
                                        placeholder="Enter your answer"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-light-secondary dark:bg-dark-secondary border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold transition-all"
                                        placeholder="Enter new password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy dark:bg-gold text-white dark:text-dark-bg font-display font-bold py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : step === 1 ? "Get Question" : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}