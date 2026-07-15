// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class", // Essential for theme toggle
    theme: {
        extend: {
            colors: {
                // Light Mode — Beige/Cream Theme
                light: {
                    bg: "#FAF9F6", // Off-white cream
                    card: "#FFFFFF", // Card surface
                    secondary: "#F3EEDD", // Beige panel
                    border: "#E3D5B8", // Warm beige border/hairline
                    text: "#1A1A1A", // Dark charcoal
                    muted: "#5C5548", // Warm gray
                },
                // Dark Mode — Midnight Blue Theme
                dark: {
                    bg: "#0A1628", // Deep midnight blue
                    card: "#101F3D", // Card surface, slightly lighter navy
                    secondary: "#0F1E3D", // Dark navy panel
                    border: "#1E3A5F", // Medium navy hairline
                    text: "#F5F5DC", // Cream text
                    muted: "#8FA3BF", // Light blue-gray
                },
                // Shared accent vocabulary — used contextually per theme
                navy: "#1E3A5F",
                burgundy: "#7A1F2B",
                gold: "#FFB347",
                coral: "#FF6B6B",
            },
            fontFamily: {
                display: ["var(--font-display)", "system-ui", "sans-serif"],
                sans: ["var(--font-body)", "system-ui", "sans-serif"],
            },
            boxShadow: {
                plaque: "0 1px 2px rgba(26,26,26,0.04), 0 6px 16px rgba(26,26,26,0.06)",
                "plaque-dark": "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px rgba(0,0,0,0.4)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "rise-in": {
                    "0%": { opacity: "0", transform: "translateY(6px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "collapse-down": {
                    "0%": { opacity: "0", transform: "translateY(-4px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.35s ease-out both",
                "rise-in": "rise-in 0.4s ease-out both",
                "collapse-down": "collapse-down 0.2s ease-out both",
            },
        },
    },
    plugins: [],
} satisfies Config;