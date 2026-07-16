// app/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home, BarChart3, Settings, Wallet, TrendingUp, TrendingDown,
  Users, Clock, Calendar, ChevronDown, ChevronUp, Loader2, RefreshCw,
  LogOut, User, Palette, Download, Filter, TrendingUpIcon, Activity, Zap,
  X, Bell, Shield, Smartphone, Eye, Lock, RotateCcw, HelpCircle, Info, CheckCircle, AlertCircle
} from "lucide-react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { format, parseISO, startOfWeek, endOfWeek, subWeeks, isWithinInterval, formatDistanceToNow } from "date-fns";
import ThemeToggle from "./components/ThemeToggle";
import { useIsDarkMode } from "./hooks/useTheme";
import { initializeNotifications, notifyTransaction, requestNotificationPermission } from "./utils/notifications";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/mpesa";
const SETTINGS_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/mpesa', '/api/settings') || "http://localhost:3001/api/settings";

function RackWatermark({ className, fill }: { className?: string; fill: string }) {
  const r = 6;
  const rows = [0, 1, 2, 3, 4];
  const positions: [number, number][] = [];
  rows.forEach((row) => {
    for (let i = 0; i <= row; i++) {
      positions.push([i - row / 2, row]);
    }
  });
  return (
    <svg viewBox="-50 -6 100 100" className={className} aria-hidden="true">
      {positions.map(([x, y], idx) => (
        <circle key={idx} cx={x * 18} cy={y * 18} r={r} fill={fill} />
      ))}
    </svg>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 lg:mb-4 text-light-muted dark:text-dark-muted flex items-center gap-2">
      {icon} {children}
    </h2>
  );
}

function Plaque({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-light-card border border-light-border rounded-2xl shadow-plaque dark:bg-dark-card dark:border-dark-border dark:shadow-plaque-dark transition-colors ${className}`}>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "reports" | "settings">("home");
  const [reportsData, setReportsData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isDark = useIsDarkMode();
  const [previousTransactionCount, setPreviousTransactionCount] = useState(0);
  const [monthFilter, setMonthFilter] = useState(format(new Date(), "yyyy-MM"));
  const [isExpanded, setIsExpanded] = useState(false);

  // Analytics state
  const [reportStartDate, setReportStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"));
  const [reportEndDate, setReportEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [downloadFormat, setDownloadFormat] = useState<"csv" | "pdf">("csv");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    enableNotifications: true,
    dailySummary: false,
    sessionTimeout: 30,
    displayDensity: "standard",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // 🔒 AUTHENTICATION CHECK
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // 🔔 INITIALIZE NOTIFICATIONS
  useEffect(() => {
    initializeNotifications();
  }, []);

  // FETCH SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      try {
        const res = await axios.get(SETTINGS_API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) {
          setSettings(res.data.settings);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    if (activeTab === "settings") fetchSettings();
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  // 🔔 DETECT NEW TRANSACTIONS AND SEND NOTIFICATIONS
  useEffect(() => {
    if (transactions.length > previousTransactionCount && settings.enableNotifications) {
      const newTransactionCount = transactions.length - previousTransactionCount;
      const newTransactions = transactions.slice(0, newTransactionCount);
      newTransactions.forEach((transaction) => {
        notifyTransaction(transaction);
      });
    }
    setPreviousTransactionCount(transactions.length);
  }, [transactions, settings.enableNotifications]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/reports`),
        axios.get(`${API_URL}/dashboard-data`),
      ]);
      if (reportsRes.data.success) setReportsData(reportsRes.data);
      if (transactionsRes.data.success) setTransactions(transactionsRes.data.recentTransactions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeeklyStats = () => {
    if (!reportsData) return { currentGames: 0, currentRevenue: 0, wowGrowth: 0 };
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);
    let currentRevenue = 0, lastWeekRevenue = 0;

    reportsData.dailyStats.forEach((day: any) => {
      const date = parseISO(day.date);
      if (isWithinInterval(date, { start: thisWeekStart, end: thisWeekEnd })) currentRevenue += day.revenue;
      if (isWithinInterval(date, { start: lastWeekStart, end: lastWeekEnd })) lastWeekRevenue += day.revenue;
    });

    const wowGrowth = lastWeekRevenue === 0 ? 100 : ((currentRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;
    return { currentGames: Math.round(currentRevenue / 100), currentRevenue, wowGrowth: Math.round(wowGrowth) };
  };

  const weeklyStats = getWeeklyStats();
  const currentBalance = reportsData ? parseFloat(reportsData.totalAllTime.revenue) : 0;
  const filteredTransactions = transactions.filter((tx) => format(parseISO(tx.createdAt), "yyyy-MM") === monthFilter);

  // ========== ANALYTICS CALCULATIONS ==========
  const getTableUtilizationMetrics = () => {
    if (!reportsData) return { occupancyRate: 0, revpath: 0, avgSessionDuration: 0, heatmapData: [] };
    const totalRevenue = parseFloat(reportsData.totalAllTime.revenue);
    const numTables = 8;
    const businessHoursPerDay = 12;
    const daysOperating = reportsData.dailyStats.length || 1;
    const totalAvailableHours = numTables * businessHoursPerDay * daysOperating;
    const totalHoursPlayed = Math.round(totalRevenue / 100);
    const occupancyRate = (totalHoursPlayed / totalAvailableHours) * 100;
    const revpath = totalAvailableHours > 0 ? totalRevenue / totalAvailableHours : 0;
    return { occupancyRate: Math.round(occupancyRate * 10) / 10, revpath: Math.round(revpath), avgSessionDuration: 1.5, heatmapData: [] };
  };

  const getSalesMixMetrics = () => {
    const total = parseFloat(reportsData?.totalAllTime.revenue || 0);
    const tableRevenue = total * 0.65;
    const fandBRevenue = total * 0.30;
    const retailRevenue = total * 0.05;
    return {
      salesMixData: [
        { name: 'Table Bookings', value: 65, actual: Math.round(tableRevenue) },
        { name: 'F&B', value: 30, actual: Math.round(fandBRevenue) },
        { name: 'Retail/Merch', value: 5, actual: Math.round(retailRevenue) }
      ],
      fandBAttachmentRate: 72,
      avgTicketValue: total / (Math.round(total / 100) || 1)
    };
  };

  const getCustomerBehaviorMetrics = () => {
    const topCustomers = reportsData?.topCustomers || [];
    return {
      peakCustomers: Math.round(topCustomers.length * 0.4),
      offPeakCustomers: Math.round(topCustomers.length * 0.3),
      regularCustomers: Math.round(topCustomers.length * 0.3),
      cohortData: [
        { week: 'Week 1', retention: 100 }, { week: 'Week 2', retention: 88 },
        { week: 'Week 3', retention: 76 }, { week: 'Week 4', retention: 68 },
        { week: 'Week 5', retention: 62 }, { week: 'Week 6', retention: 58 }
      ],
      leagueParticipationRate: 15
    };
  };

  const generateCSV = () => {
    if (!reportsData) return '';
    let csv = 'Billiard Tracker - Statement Report\n';
    csv += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
    csv += `Period: ${reportStartDate} to ${reportEndDate}\n\n`;
    csv += 'DAILY REVENUE\nDate,Revenue,Games\n';
    reportsData.dailyStats.forEach((day: any) => { csv += `${day.date},${day.revenue},${day.games}\n`; });
    csv += '\n\nTRANSACTIONS\nDate,Reference,Phone,Amount,Type\n';
    transactions.forEach((tx: any) => { csv += `${format(parseISO(tx.createdAt), 'yyyy-MM-dd HH:mm:ss')},${tx.billRefNumber},${tx.msisdn},${tx.transAmount},M-Pesa\n`; });
    csv += `\n\nSUMMARY\nTotal Revenue,${reportsData.totalAllTime.revenue}\nTotal Games,${reportsData.totalAllTime.games}\n`;
    return csv;
  };

  const downloadReport = async () => {
    setIsDownloading(true);
    try {
      if (downloadFormat === 'csv') {
        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billiard-statement-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setShowExportModal(false);
      } else {
        alert('PDF export feature will be available soon. Please use CSV for now.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleSettingChange = async (key: string, value: any) => {
    if (key === 'enableNotifications' && value === true) {
      const granted = await requestNotificationPermission();
      if (!granted) return; // Don't update state if permission denied
    }

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        await axios.put(SETTINGS_API_URL, newSettings, { headers: { Authorization: `Bearer ${token}` } });
      } catch (error) {
        console.error("Failed to save settings", error);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    const token = localStorage.getItem("auth_token");
    try {
      const res = await axios.put(`${SETTINGS_API_URL}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setPasswordSuccess("");
          setIsChangingPassword(false);
        }, 2000);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to change password.");
    }
  };

  const tableUtilization = getTableUtilizationMetrics();
  const salesMix = getSalesMixMetrics();
  const customerBehavior = getCustomerBehaviorMetrics();

  const axisStroke = isDark ? "#8FA3BF" : "#5C5548";
  const barFill = isDark ? "#FFB347" : "#1E3A5F";
  const lineRevenue = isDark ? "#FFB347" : "#1E3A5F";
  const lineGames = isDark ? "#FF6B6B" : "#7A1F2B";
  const gridStroke = isDark ? "#1E3A5F" : "#E3D5B8";
  const tooltipStyle = {
    backgroundColor: isDark ? "#101F3D" : "#FFFFFF",
    borderColor: isDark ? "#1E3A5F" : "#E3D5B8",
    color: isDark ? "#F5F5DC" : "#1A1A1A",
    fontSize: "12px",
    borderRadius: "10px",
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    router.push("/login");
  };

  if (isLoading && !reportsData) {
    return (
      <main className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center transition-colors">
        <Loader2 className="animate-spin text-navy dark:text-gold" size={36} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text pb-28 lg:pb-8 transition-colors" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* ================= HOME TAB ================= */}
      {activeTab === "home" && (
        <div className="p-4 sm:p-6 lg:p-8 lg:max-w-7xl lg:mx-auto space-y-4 lg:space-y-6 animate-fade-in">
          <header className="flex items-center justify-between pt-4 sm:pt-6">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-navy dark:text-gold mb-1">Billiard Tracker</p>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">Home</h1>
            </div>
            <button onClick={fetchData} aria-label="Refresh data" className="p-2.5 rounded-full bg-light-secondary border border-light-border hover:border-navy/40 dark:bg-dark-secondary dark:border-dark-border dark:hover:border-gold/40 transition-colors">
              <RefreshCw size={16} className={`text-light-muted dark:text-dark-muted ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </header>
          {lastUpdated && <p className="text-[11px] text-light-muted dark:text-dark-muted -mt-3">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>}

          <Plaque className="relative overflow-hidden border-t-4 border-t-navy dark:border-t-gold animate-rise-in p-6 sm:p-7 lg:p-8">
            <RackWatermark className="absolute -bottom-3 -right-3 w-24 h-24 lg:w-32 lg:h-32 z-0 pointer-events-none" fill={isDark ? "rgba(255,179,71,0.08)" : "rgba(30,58,95,0.06)"} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-navy dark:text-gold mb-3">
                <Wallet size={18} />
                <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Current Till Balance</span>
              </div>
              <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tabular-nums mb-6 sm:mb-7 break-words">
                <span className="text-xl sm:text-2xl lg:text-3xl align-top mr-2 text-light-muted dark:text-dark-muted">KES</span>
                {currentBalance.toLocaleString()}
              </p>
              <div className="grid grid-cols-2 divide-x divide-light-border dark:divide-dark-border border-t border-light-border dark:border-dark-border pt-4 lg:pt-5 gap-4 lg:gap-6">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2">Games This Week</p>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-display font-bold tabular-nums">{weeklyStats.currentGames}<span className="text-xs sm:text-sm lg:text-base font-sans font-normal text-light-muted dark:text-dark-muted ml-2">@ 100 KES</span></p>
                </div>
                <div className="pl-4 lg:pl-6">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2">vs Last Week</p>
                  <div className={`flex items-center gap-2 text-lg sm:text-2xl lg:text-3xl font-display font-bold tabular-nums ${weeklyStats.wowGrowth >= 0 ? "text-navy dark:text-gold" : "text-burgundy dark:text-coral"}`}>
                    {weeklyStats.wowGrowth >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    {Math.abs(weeklyStats.wowGrowth)}%
                  </div>
                </div>
              </div>
            </div>
          </Plaque>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 lg:items-start">
            <Plaque className="p-3 sm:p-4 animate-rise-in lg:col-span-2">
              <SectionLabel icon={<BarChart3 size={14} />}>Daily Revenue · Last 14 Days</SectionLabel>
              <div className="h-40 sm:h-48 lg:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData?.dailyStats.slice(-14) || []}>
                    <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickFormatter={(d) => d.slice(5)} tickLine={false} axisLine={false} />
                    <YAxis stroke={axisStroke} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "#1E3A5F33" : "#E3D5B855" }} />
                    <Bar dataKey="revenue" fill={barFill} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Plaque>
            <Plaque className="overflow-hidden animate-rise-in">
              <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-light-secondary/60 dark:hover:bg-dark-secondary/60 transition-colors">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                  <Calendar size={14} /> Recent Transactions
                </span>
                {isExpanded ? <ChevronUp size={16} className="text-light-muted dark:text-dark-muted" /> : <ChevronDown size={16} className="text-light-muted dark:text-dark-muted" />}
              </button>
              {isExpanded && (
                <div className="p-3 sm:p-4 pt-0 border-t border-light-border dark:border-dark-border animate-collapse-down">
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    <Calendar size={13} className="text-light-muted dark:text-dark-muted" />
                    <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-light-bg border border-light-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-navy dark:bg-dark-bg dark:border-dark-border dark:focus:ring-gold flex-1">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const d = new Date(); d.setMonth(d.getMonth() - i); const val = format(d, "yyyy-MM");
                        return <option key={val} value={val}>{format(d, "MMMM yyyy")}</option>;
                      })}
                    </select>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredTransactions.length === 0 ? (
                      <p className="text-center text-light-muted dark:text-dark-muted text-xs sm:text-sm py-4">No transactions for this month.</p>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between items-start p-2 sm:p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-semibold text-xs sm:text-sm truncate">{tx.billRefNumber || "No Reference"}</p>
                            <p className="text-xs text-light-muted dark:text-dark-muted font-mono truncate">{tx.msisdn} · {tx.transId}</p>
                            <p className="text-[10px] text-light-muted dark:text-dark-muted mt-1">{format(parseISO(tx.createdAt), "MMM d, h:mm a")}</p>
                          </div>
                          <span className="font-display font-bold tabular-nums text-navy dark:text-gold text-xs sm:text-sm shrink-0">
                            +KES {parseFloat(tx.transAmount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </Plaque>
          </div>
        </div>
      )}

      {/* ================= REPORTS TAB ================= */}
      {activeTab === "reports" && reportsData && (
        <div className="p-4 sm:p-6 lg:p-8 lg:max-w-7xl lg:mx-auto space-y-4 lg:space-y-6 animate-fade-in">
          <header className="pt-4 sm:pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-navy dark:text-gold mb-1">Business Intelligence</p>
              <h1 className="text-2xl lg:text-3xl font-display font-bold">Reports</h1>
            </div>
          </header>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Plaque className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted mb-1">All-Time Revenue</p>
              <p className="text-sm sm:text-base lg:text-xl font-display font-bold tabular-nums text-navy dark:text-gold">KES {reportsData.totalAllTime.revenue.toLocaleString()}</p>
            </Plaque>
            <Plaque className="p-3 sm:p-4 text-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted mb-1">All-Time Games</p>
              <p className="text-sm sm:text-base lg:text-xl font-display font-bold tabular-nums text-burgundy dark:text-coral">{reportsData.totalAllTime.games}</p>
            </Plaque>
            <Plaque className="p-3 sm:p-4 text-center col-span-2 lg:col-span-2">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted mb-1">Avg. Revenue Per Game</p>
              <p className="text-sm sm:text-base lg:text-xl font-display font-bold tabular-nums text-navy dark:text-gold">
                KES {reportsData.totalAllTime.games > 0 ? Math.round(reportsData.totalAllTime.revenue / reportsData.totalAllTime.games) : 0}
              </p>
            </Plaque>
          </div>
          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<TrendingUp size={14} />}>Revenue vs Games Played</SectionLabel>
            <div className="h-48 sm:h-56 lg:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportsData.dailyStats.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="date" stroke={axisStroke} fontSize={10} tickFormatter={(d) => d.slice(5)} />
                  <YAxis yAxisId="left" stroke={lineRevenue} fontSize={10} />
                  <YAxis yAxisId="right" orientation="right" stroke={lineGames} fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke={lineRevenue} strokeWidth={2} dot={false} name="Revenue (KES)" />
                  <Line yAxisId="right" type="monotone" dataKey="games" stroke={lineGames} strokeWidth={2} dot={false} name="Games" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Plaque>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start">
            <Plaque className="p-3 sm:p-4">
              <SectionLabel icon={<Clock size={14} />}>Busiest Times · Revenue Intensity</SectionLabel>
              <div className="space-y-3">
                {reportsData.heatmapStats.slice(0, 5).map((slot: any, idx: number) => {
                  const pct = Math.min((slot.revenue / (reportsData.totalAllTime.revenue || 1)) * 500, 100);
                  return (
                    <div key={idx} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted w-16 sm:w-20 shrink-0">{slot.day} {slot.hour}:00</span>
                      <div className="flex-1 bg-light-secondary dark:bg-dark-secondary rounded-full h-2 sm:h-2.5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-navy to-burgundy dark:from-gold dark:to-coral" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] sm:text-xs font-display font-semibold tabular-nums w-12 sm:w-16 text-right shrink-0">KES {slot.revenue}</span>
                    </div>
                  );
                })}
              </div>
            </Plaque>
            <Plaque className="p-3 sm:p-4">
              <SectionLabel icon={<Users size={14} />}>Top Regulars</SectionLabel>
              <div className="space-y-2">
                {reportsData.topCustomers.map((cust: any, idx: number) => {
                  const rankStyle = idx === 0 ? "bg-gold/15 border-gold text-gold" : idx === 1 ? "bg-light-muted/15 border-light-muted text-light-muted dark:bg-dark-muted/20 dark:border-dark-muted dark:text-dark-muted" : idx === 2 ? "bg-burgundy/15 border-burgundy text-burgundy dark:bg-coral/15 dark:border-coral dark:text-coral" : "bg-light-secondary border-light-border text-light-muted dark:bg-dark-secondary dark:border-dark-border dark:text-dark-muted";
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full border flex items-center justify-center font-display font-bold text-xs shrink-0 ${rankStyle}`}>{idx + 1}</div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold truncate">{cust.lastName || "Customer"}</p>
                          <p className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted font-mono truncate">{cust.phone} · {cust.visits} visits</p>
                        </div>
                      </div>
                      <span className="font-display font-bold tabular-nums text-navy dark:text-gold text-xs sm:text-sm shrink-0 ml-2">KES {cust.totalSpent.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </Plaque>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Plaque className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity size={14} className="text-navy dark:text-gold" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted">Table Occupancy Rate</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-navy dark:text-gold">{tableUtilization.occupancyRate}%</p>
            </Plaque>
            <Plaque className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUpIcon size={14} className="text-burgundy dark:text-coral" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted">RevPATH</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-burgundy dark:text-coral">KES {tableUtilization.revpath}</p>
            </Plaque>
            <Plaque className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={14} className="text-gold dark:text-gold" />
                <p className="text-[10px] sm:text-xs uppercase tracking-wide text-light-muted dark:text-dark-muted">Avg Session</p>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gold">{tableUtilization.avgSessionDuration}h</p>
            </Plaque>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Plaque className="p-3 sm:p-4">
              <SectionLabel icon={<Zap size={14} />}>Sales Mix Breakdown</SectionLabel>
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={salesMix.salesMixData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                      <Cell fill={isDark ? "#FFB347" : "#1E3A5F"} />
                      <Cell fill={isDark ? "#FF6B6B" : "#7A1F2B"} />
                      <Cell fill={isDark ? "#8FA3BF" : "#5C5548"} />
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Plaque>
            <Plaque className="p-3 sm:p-4">
              <SectionLabel icon={<TrendingUp size={14} />}>Cohort Retention Curve</SectionLabel>
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customerBehavior.cohortData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="week" stroke={axisStroke} fontSize={10} />
                    <YAxis stroke={axisStroke} fontSize={10} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value}%`} />
                    <Line type="monotone" dataKey="retention" stroke={isDark ? "#FFB347" : "#1E3A5F"} strokeWidth={2} dot={{ fill: isDark ? "#FFB347" : "#1E3A5F", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Plaque>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="fixed bottom-32 lg:bottom-8 right-4 lg:right-8 w-14 h-14 rounded-full bg-navy dark:bg-gold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-light-card dark:text-dark-bg z-40"
            aria-label="Export statement"
          >
            <Download size={24} />
          </button>
          {showExportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
              <Plaque className="w-full max-w-sm p-5 sm:p-6 rounded-2xl my-auto">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Download size={20} className="text-navy dark:text-gold shrink-0" />
                    <h2 className="text-lg sm:text-xl font-display font-bold truncate">Export Statement</h2>
                  </div>
                  <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 rounded-lg transition-colors shrink-0 ml-2">
                    <X size={18} className="text-light-muted dark:text-dark-muted" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="min-w-0">
                    <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">From Date</label>
                    <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold" />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">To Date</label>
                    <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold" />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">Format</label>
                    <select value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as 'csv' | 'pdf')} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold">
                      <option value="csv">CSV (Spreadsheet)</option>
                      <option value="pdf">PDF (Document)</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-light-border dark:border-dark-border flex gap-2 sm:gap-3">
                    <button onClick={() => setShowExportModal(false)} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-light-secondary dark:bg-dark-secondary text-light-text dark:text-dark-text hover:bg-light-secondary/80 dark:hover:bg-dark-secondary/80 transition-colors font-semibold text-sm sm:text-base">
                      Cancel
                    </button>
                    <button onClick={downloadReport} disabled={isDownloading} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-navy dark:bg-gold text-light-card dark:text-dark-bg hover:opacity-90 disabled:opacity-50 transition-opacity font-semibold text-sm sm:text-base flex items-center justify-center gap-2 min-w-0">
                      <Download size={14} className="shrink-0" />
                      <span className="truncate">{isDownloading ? 'Downloading...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              </Plaque>
            </div>
          )}
        </div>
      )}

      {/* ================= SETTINGS TAB ================= */}
      {activeTab === "settings" && (
        <div className="p-4 sm:p-6 lg:p-8 lg:max-w-7xl lg:mx-auto space-y-4 lg:space-y-6 animate-fade-in">
          <header className="pt-4 sm:pt-6">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-navy dark:text-gold mb-1">Preferences</p>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Settings</h1>
          </header>

          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<User size={14} />}>Account</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-light-text dark:text-dark-text">Username</p>
                  <p className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted font-mono truncate">{localStorage.getItem("auth_username") || "admin"}</p>
                </div>
                <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-navy/10 dark:bg-gold/10 text-navy dark:text-gold flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
              </div>
              <button onClick={() => { setIsChangingPassword(true); setPasswordError(""); setPasswordSuccess(""); }} className="w-full flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 hover:bg-light-secondary/70 dark:hover:bg-dark-secondary/70 rounded-lg border border-light-border/60 dark:border-dark-border/60 transition-colors">
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Lock size={16} className="text-navy dark:text-gold" />
                  Change Password
                </span>
                <ChevronDown size={16} className="-rotate-90 text-light-muted dark:text-dark-muted" />
              </button>
            </div>
          </Plaque>

          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<Palette size={14} />}>Appearance</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-light-text dark:text-dark-text">App Theme</p>
                  <p className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted">Light, Dark, or System Default</p>
                </div>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Eye size={16} className="text-navy dark:text-gold" />
                  Display Density
                </span>
                <select
                  value={settings.displayDensity}
                  onChange={(e) => handleSettingChange('displayDensity', e.target.value)}
                  className="text-xs px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-navy dark:focus:ring-gold"
                >
                  <option value="compact">Compact</option>
                  <option value="standard">Standard</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
            </div>
          </Plaque>

          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<Bell size={14} />}>Notifications</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold">Enable Notifications</p>
                  <p className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted">Get alerts for new transactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  className="w-5 h-5 rounded accent-navy dark:accent-gold cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold">Daily Summary</p>
                  <p className="text-[10px] sm:text-xs text-light-muted dark:text-dark-muted">Receive daily revenue reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dailySummary}
                  onChange={(e) => handleSettingChange('dailySummary', e.target.checked)}
                  className="w-5 h-5 rounded accent-navy dark:accent-gold cursor-pointer"
                />
              </div>
            </div>
          </Plaque>

          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<Shield size={14} />}>Security & Privacy</SectionLabel>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-border/60 dark:border-dark-border/60">
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Smartphone size={16} className="text-navy dark:text-gold" />
                  Session Timeout
                </span>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="text-xs px-2 py-1 rounded border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-navy dark:focus:ring-gold"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center justify-between p-3 sm:p-4 bg-light-secondary/50 dark:bg-dark-secondary/50 hover:bg-light-secondary/70 dark:hover:bg-dark-secondary/70 rounded-lg border border-light-border/60 dark:border-dark-border/60 transition-colors">
                <span className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <RotateCcw size={16} className="text-navy dark:text-gold" />
                  Clear Cache & Reset
                </span>
                <ChevronDown size={16} className="-rotate-90 text-light-muted dark:text-dark-muted" />
              </button>
            </div>
          </Plaque>

          <Plaque className="p-3 sm:p-4">
            <SectionLabel icon={<LogOut size={14} />}>Security</SectionLabel>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-3 sm:p-4 bg-coral/10 dark:bg-coral/10 rounded-lg border border-coral/30 text-burgundy dark:text-coral hover:bg-coral/20 transition-colors font-semibold"
            >
              <div className="flex items-center gap-3">
                <LogOut size={18} />
                <span className="text-xs sm:text-sm">Sign Out</span>
              </div>
              <ChevronDown size={16} className="-rotate-90" />
            </button>
          </Plaque>

          <div className="space-y-2 pb-4">
            <p className="text-center text-[10px] sm:text-xs text-light-muted dark:text-dark-muted">Billiard Tracker v1.0.0</p>
            <p className="text-center text-[9px] sm:text-[10px] text-light-muted/70 dark:text-dark-muted/70">© 2026 All rights reserved</p>
          </div>
        </div>
      )}

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <Plaque className="w-full max-w-sm p-5 sm:p-6 rounded-2xl my-auto">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Lock size={20} className="text-navy dark:text-gold shrink-0" />
                <h2 className="text-lg sm:text-xl font-display font-bold truncate">Change Password</h2>
              </div>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 rounded-lg transition-colors shrink-0 ml-2">
                <X size={18} className="text-light-muted dark:text-dark-muted" />
              </button>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle size={14} /> {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/30 text-burgundy dark:text-coral text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">Current Password</label>
                <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold" />
              </div>
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">New Password</label>
                <input type="password" required minLength={6} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold" />
              </div>
              <div className="min-w-0">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted mb-2 block">Confirm New Password</label>
                <input type="password" required minLength={6} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-gold" />
              </div>
              <div className="pt-4 border-t border-light-border dark:border-dark-border flex gap-2 sm:gap-3">
                <button type="button" onClick={() => setIsChangingPassword(false)} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-light-secondary dark:bg-dark-secondary text-light-text dark:text-dark-text hover:bg-light-secondary/80 dark:hover:bg-dark-secondary/80 transition-colors font-semibold text-sm sm:text-base">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-navy dark:bg-gold text-light-card dark:text-dark-bg hover:opacity-90 transition-opacity font-semibold text-sm sm:text-base flex items-center justify-center gap-2 min-w-0">
                  <Lock size={14} className="shrink-0" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </Plaque>
        </div>
      )}

      {/* ================= BOTTOM NAVIGATION ================= */}
      <nav className="fixed bottom-0 left-0 right-0 lg:fixed lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2 bg-light-card/95 backdrop-blur-xl border-t border-light-border lg:border lg:rounded-3xl lg:shadow-2xl dark:bg-dark-card/95 dark:border-dark-border w-full lg:w-auto transition-colors z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around items-center min-h-20 lg:h-auto lg:px-2">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-2xl transition-all duration-200 ${activeTab === "home" ? "text-navy dark:text-gold bg-light-secondary/50 dark:bg-dark-secondary/50" : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-secondary/30 dark:hover:bg-dark-secondary/30"}`}>
            <Home size={26} />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab("reports")} className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-2xl transition-all duration-200 ${activeTab === "reports" ? "text-navy dark:text-gold bg-light-secondary/50 dark:bg-dark-secondary/50" : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-secondary/30 dark:hover:bg-dark-secondary/30"}`}>
            <BarChart3 size={26} />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Reports</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-2xl transition-all duration-200 ${activeTab === "settings" ? "text-navy dark:text-gold bg-light-secondary/50 dark:bg-dark-secondary/50" : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-secondary/30 dark:hover:bg-dark-secondary/30"}`}>
            <Settings size={26} />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest">Settings</span>
          </button>
        </div>
      </nav>
    </main>
  );
}