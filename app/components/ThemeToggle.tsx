// app/components/ThemeToggle.tsx
"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useIsDarkMode } from "../hooks/useTheme";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
    const isDark = useIsDarkMode();
    const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("theme") || "system";
        setTheme(stored as "light" | "dark" | "system");
    }, []);

    const applyTheme = (newTheme: "light" | "dark" | "system") => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        const root = document.documentElement;

        if (newTheme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.toggle("dark", prefersDark);
        } else {
            root.classList.toggle("dark", newTheme === "dark");
        }

        setIsOpen(false);
    };

    const getIcon = () => {
        if (theme === "system") return <Monitor size={18} />;
        return isDark ? <Sun size={18} /> : <Moon size={18} />;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle theme"
                className="p-2.5 rounded-full bg-light-secondary border border-light-border text-navy hover:border-navy/40 dark:bg-dark-secondary dark:border-dark-border dark:text-gold dark:hover:border-gold/40 transition-colors"
            >
                {getIcon()}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg shadow-lg z-50">
                    <button
                        onClick={() => applyTheme("light")}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${theme === "light"
                                ? "bg-light-secondary dark:bg-dark-secondary text-navy dark:text-gold"
                                : "text-light-text dark:text-dark-text hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50"
                            }`}
                    >
                        <Moon size={16} /> Light
                    </button>
                    <button
                        onClick={() => applyTheme("dark")}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${theme === "dark"
                                ? "bg-light-secondary dark:bg-dark-secondary text-navy dark:text-gold"
                                : "text-light-text dark:text-dark-text hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50"
                            }`}
                    >
                        <Sun size={16} /> Dark
                    </button>
                    <button
                        onClick={() => applyTheme("system")}
                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors rounded-b-lg ${theme === "system"
                                ? "bg-light-secondary dark:bg-dark-secondary text-navy dark:text-gold"
                                : "text-light-text dark:text-dark-text hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50"
                            }`}
                    >
                        <Monitor size={16} /> System
                    </button>
                </div>
            )}
        </div>
    );
}