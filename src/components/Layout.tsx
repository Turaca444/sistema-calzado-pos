import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  PlusCircle, 
  History, 
  Terminal, 
  Sparkles,
  UserCheck,
  AlertCircle,
  CreditCard,
  Shield,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  User,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Plus,
  Check,
  Settings,
  LogOut,
  Clock,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Laptop,
  Smartphone,
  ShieldCheck,
  FileText,
  Download,
  Printer,
  AlertTriangle,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tenant, UserRole, User as UserType, LoginLog } from "../types";

interface LayoutProps {
  currentView: string;
  setView: (view: string) => void;
  children: React.ReactNode;
  lowStockCount: number;
  pendingDebtsCount: number;
  activeTenantId: string;
  activeRole: UserRole;
  tenants: Tenant[];
  onTenantChange: (id: string) => void;
  onRoleChange: (role: UserRole) => void;
  onToggleTenantStatus: (id: string) => Promise<void>;
  onUpdateTenantName?: (tenantId: string, newName: string) => Promise<void> | void;
  users: UserType[];
  activeUserId: string;
  onUserChange: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, avatarUrl?: string) => Promise<void>;
  onUpdateUser: (id: string, name: string, email: string, role: UserRole, avatarUrl?: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onLogout?: () => void;
  loginLogs?: LoginLog[];
  onClearLoginLogs?: () => Promise<void>;
  onDeleteSingleLog?: (id: string) => Promise<void>;
}

export default function Layout({ 
  currentView, 
  setView, 
  children,
  lowStockCount,
  pendingDebtsCount,
  activeTenantId,
  activeRole,
  tenants,
  onTenantChange,
  onRoleChange,
  onToggleTenantStatus,
  onUpdateTenantName,
  users = [],
  activeUserId,
  onUserChange,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLogout,
  loginLogs = [],
  onClearLoginLogs,
  onDeleteSingleLog
}: LayoutProps) {
  
  const [showManageUsers, setShowManageUsers] = React.useState(false);
  const [showLoginLogsModal, setShowLoginLogsModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editTenantNameInput, setEditTenantNameInput] = useState("");
  const [logRoleFilter, setLogRoleFilter] = useState<"todos" | "administrador" | "vendedor">("todos");
  const [logSearch, setLogSearch] = useState("");
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState<UserRole>("vendedor");
  const [editAvatarUrl, setEditAvatarUrl] = React.useState("");
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState<UserRole>("vendedor");
  const [newUserAvatarUrl, setNewUserAvatarUrl] = React.useState("");
  const [deletingLogId, setDeletingLogId] = React.useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = React.useState(false);

  // Quick photo modal state
  const [quickPhotoUser, setQuickPhotoUser] = React.useState<UserType | null>(null);
  const [quickPhotoUrl, setQuickPhotoUrl] = React.useState<string>("");

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen excede el límite de 5MB. Por favor elige una imagen más pequeña.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const PRESET_AVATARS = [
    { label: "Admin Elena", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { label: "Admin Carlos", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { label: "Admin Patricia", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80" },
    { label: "Admin Roberto", url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80" },
    { label: "Vendedora Sofía", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { label: "Vendedor Pedro", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { label: "Vendedora Camila", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80" },
    { label: "Vendedor Lucas", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" }
  ];

  const currentTenant = tenants.find((t) => t.id === activeTenantId);

  // Function to generate and download PDF Report of Login Logs
  const generateLoginLogsPDF = (logsToExport: LoginLog[]) => {
    if (!logsToExport || logsToExport.length === 0) {
      alert("No hay registros de ingreso disponibles para exportar a PDF.");
      return;
    }

    const doc = new jsPDF();
    const tenantName = currentTenant?.name || "Comercio";

    // Header Background Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 34, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`CONTROL Y AUDITORÍA DE INGRESOS - ${tenantName.toUpperCase()}`, 14, 14);

    // Subtitle & Argentina Time
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225); // slate-300
    const argNow = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    doc.text(`Reporte Oficial | Emitido: ${argNow} hs (Hora Oficial Argentina - ART)`, 14, 22);
    doc.text(`Sistema SaaS J&Z - Control de Personal (Administrador y Vendedor)`, 14, 28);

    // Metrics Box
    const total = logsToExport.length;
    const adminCount = logsToExport.filter((l) => l.role === "administrador").length;
    const vendCount = logsToExport.filter((l) => l.role === "vendedor").length;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 38, 182, 16, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Total Registros: ${total}`, 20, 48);

    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(`Administradores: ${adminCount}`, 75, 48);

    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`Vendedores: ${vendCount}`, 140, 48);

    // Table Data
    const tableBody = logsToExport.map((log) => [
      log.dateFormatted,
      log.userName,
      log.role.toUpperCase(),
      log.userEmail || "-",
      log.deviceInfo || "Navegador Web",
      "EXITOSO"
    ]);

    autoTable(doc, {
      startY: 58,
      head: [["Fecha y Hora (ARG)", "Usuario / Operador", "Rol", "Email", "Dispositivo", "Estado"]],
      body: tableBody,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 42 },
        1: { fontStyle: "bold", cellWidth: 38 },
        2: { cellWidth: 26 },
        3: { cellWidth: 38 },
        4: { cellWidth: 24 },
        5: { cellWidth: 14 }
      },
      margin: { left: 14, right: 14 }
    });

    const fileName = `Control_Ingresos_${tenantName.replace(/\s+/g, "_")}_ART.pdf`;
    doc.save(fileName);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Artículos", icon: ShoppingBag, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: "bg-amber-500" },
    { id: "customers", label: "Clientes", icon: Users, badge: pendingDebtsCount > 0 ? pendingDebtsCount : undefined, badgeColor: "bg-red-500" },
    { id: "sales-new", label: "Nueva Venta", icon: PlusCircle, highlight: true },
    { id: "history", label: "Historial", icon: History },
    { id: "api-docs", label: "API Sandbox", icon: Terminal },
  ];

  // Resolve active tenant details
  const activeUser = (users && users.length > 0) ? (users.find(u => u.id === activeUserId) || users[0]) : null;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-800">
        
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black font-display tracking-tight text-white leading-tight">JM SOFTWARE</h1>
            <p className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase">Multi-Inquilino ERP</p>
          </div>
        </div>

        {/* ================== SAAS CONTROL PANEL (Interactive Demo Widget) ================== */}
        <div className="p-4 mx-4 my-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">SaaS Control Hub</span>
            <span className="text-[9px] bg-indigo-950 text-indigo-300 font-semibold px-1.5 py-0.5 rounded-md border border-indigo-900/40">
              DEMO LIVE
            </span>
          </div>

          {/* Tenant Dropdown Selector */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">Comercio Activo (Tenant)</label>
              {onUpdateTenantName && currentTenant && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTenantId(currentTenant.id);
                    setEditTenantNameInput(currentTenant.name);
                    setShowEditTenantModal(true);
                  }}
                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Cambiar el nombre de este comercio"
                >
                  <Edit className="h-3 w-3" />
                  <span>Cambiar Nombre</span>
                </button>
              )}
            </div>
            <select
              value={activeTenantId}
              onChange={(e) => onTenantChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Status Display & Simulation Toggle */}
          {currentTenant && (
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Estado de Pago:</span>
                <span className={`inline-flex items-center space-x-1 font-bold px-2 py-0.5 rounded-full text-[9px] ${
                  currentTenant.status === "active" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  <span className={`h-1 w-1 rounded-full ${currentTenant.status === "active" ? "bg-emerald-400" : "bg-red-400"}`}></span>
                  <span>{currentTenant.status === "active" ? "ACTIVO" : "SUSPENDIDO"}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Plan:</span>
                <span className="text-slate-200 font-mono font-bold text-[10px]">{currentTenant.plan}</span>
              </div>

              {/* Toggle Suspension button */}
              <button
                type="button"
                onClick={() => onToggleTenantStatus(currentTenant.id)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-all ${
                  currentTenant.status === "active"
                    ? "bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30"
                    : "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                }`}
              >
                <span>{currentTenant.status === "active" ? "Simular Falta de Pago" : "Activar Licencia"}</span>
              </button>
            </div>
          )}

          {/* Dynamic Active User / Seller Switcher */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="block text-[9px] font-bold text-slate-400 uppercase">Usuario / Operador</label>
              <button
                type="button"
                onClick={() => setShowManageUsers(true)}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-0.5"
                title="Administrar personal / locales"
              >
                <Settings className="h-3 w-3" />
                <span>Gestionar</span>
              </button>
            </div>
            
            <select
              value={activeUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "administrador" ? "Admin" : "Vendedor"})
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
              {activeUser?.avatarUrl ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  className="h-7 w-7 rounded-lg object-cover border border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[9px] shrink-0 ${
                  activeRole === "administrador" ? "bg-indigo-900/60 text-indigo-300 border border-indigo-700/50" : "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50"
                }`}>
                  {activeRole === "administrador" ? "AD" : "VD"}
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] font-bold text-white truncate">{activeUser?.name || "Usuario"}</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">{activeUser?.email}</div>
              </div>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] uppercase shrink-0 ${
                activeRole === "administrador" ? "text-indigo-400 bg-indigo-950/60 border border-indigo-900/40" : "text-emerald-400 bg-emerald-950/60 border border-emerald-900/40"
              }`}>
                {activeRole}
              </span>
            </div>

            {/* Quick Button for Login Audit Logs */}
            <button
              type="button"
              onClick={() => setShowLoginLogsModal(true)}
              className="w-full text-[10px] bg-slate-900/80 hover:bg-indigo-950/60 text-indigo-300 hover:text-indigo-200 p-2 rounded-xl border border-slate-800 hover:border-indigo-800/60 transition-all flex items-center justify-between font-medium group"
              title="Ver registro e historial de ingresos de Administradores y Vendedores con fecha y hora"
            >
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Registro de Ingresos</span>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                {loginLogs.length}
              </span>
            </button>
            
            {activeRole === "vendedor" && (
              <p className="text-[9px] text-amber-400/80 leading-snug font-medium text-center">
                ⚠️ Rol Vendedor: bloqueados los accesos catastróficos (borrado).
              </p>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? item.highlight 
                      ? "bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20"
                      : "bg-slate-800 text-white font-medium border-l-4 border-indigo-500"
                    : item.highlight
                      ? "text-indigo-400 hover:bg-slate-800/50 hover:text-indigo-300 border border-dashed border-indigo-900/40 my-1 font-medium"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-400 text-white" : "text-slate-500"}`} />
                  <span className="text-xs">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>SaaS Server Ingress</span>
            <span className="flex items-center space-x-1 font-mono text-[9px] text-emerald-400">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span>MULTI-TENANT ON</span>
            </span>
          </div>
          <div className="text-[9px] text-slate-600 font-mono text-center">
            Tenant: {activeTenantId} | Puerto: 3000
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
              {currentTenant ? currentTenant.name : "JM SOFTWARE"}
            </span>
            {lowStockCount > 0 && (
              <span className="flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>{lowStockCount} artículos críticos</span>
              </span>
            )}

            {/* Header Login Audit Logs Button */}
            <button
              type="button"
              onClick={() => setShowLoginLogsModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200/80 transition-all text-xs font-semibold shadow-xs"
              title="Ver Registro de Ingresos de Administradores y Vendedores (Fecha y Hora)"
            >
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
              <div className="hidden md:flex flex-col text-left leading-none">
                <span className="text-[10px] font-bold text-indigo-950">Ingresos</span>
                <span className="text-[8.5px] text-indigo-600 font-mono font-medium">
                  {loginLogs.length > 0 ? loginLogs[0].dateFormatted : "Sin ingresos"}
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 flex items-center justify-end space-x-1">
                {activeUser?.role === "administrador" ? (
                  <>
                    <Shield className="h-3 w-3 text-indigo-500 fill-indigo-50" />
                    <span>{activeUser ? activeUser.name : "Admin"}</span>
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 text-emerald-500" />
                    <span>{activeUser ? activeUser.name : "Vendedor"}</span>
                  </>
                )}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {activeUser ? activeUser.email : "..."} ({activeUser ? activeUser.role : ""})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeUser) {
                  setQuickPhotoUser(activeUser);
                  setQuickPhotoUrl(activeUser.avatarUrl || activeUser.photoUrl || "");
                }
              }}
              className="relative group focus:outline-none cursor-pointer"
              title="Haz clic para cambiar tu foto de perfil"
            >
              {activeUser?.avatarUrl ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  className="h-9 w-9 rounded-xl object-cover border border-slate-200 shadow-sm ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 shrink-0 transition-all"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-extrabold text-xs shadow-sm transition-all ${
                  activeUser?.role === "administrador"
                    ? "bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-100"
                    : "bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-100"
                }`}>
                  {activeUser?.role === "administrador" ? "AD" : "VD"}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow-xs group-hover:scale-110 transition-all">
                <Camera className="h-2.5 w-2.5" />
              </div>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition-all text-xs font-bold"
                title="Cerrar sesión / Cambiar perfil de ingreso"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Salir</span>
              </button>
            )}
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTenantId + "_" + currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* SaaS Personal & Multi-Vendedor Hub Modal */}
      {showManageUsers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-display uppercase tracking-wider">Gestión de Personal</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">Administra administradores y vendedores de los distintos locales</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManageUsers(false);
                  setEditingUserId(null);
                }}
                className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">

              {/* Registered Tenants / Stores Section */}
              <div className="space-y-3 pb-5 border-b border-slate-200/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Comercios Registrados ({tenants.length})</h4>
                  <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/80">
                    SaaS Multi-Inquilino
                  </span>
                </div>

                <div className="space-y-2">
                  {tenants.map((t) => {
                    const isEditingThisTenant = editingTenantId === t.id && !showEditTenantModal;
                    const isCurrentActive = t.id === activeTenantId;

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentActive
                            ? "bg-indigo-50/50 border-indigo-200 shadow-xs"
                            : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        {isEditingThisTenant ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editTenantNameInput}
                              onChange={(e) => setEditTenantNameInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs font-bold border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                              placeholder="Nuevo nombre del comercio..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (!editTenantNameInput.trim()) return;
                                if (onUpdateTenantName) {
                                  await onUpdateTenantName(t.id, editTenantNameInput.trim());
                                }
                                setEditingTenantId(null);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                              title="Guardar nombre"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTenantId(null)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`p-2 rounded-xl shrink-0 ${isCurrentActive ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"}`}>
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <div className="truncate text-left">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-black text-slate-900">{t.name}</span>
                                  {isCurrentActive && (
                                    <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                      Activo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono block truncate">
                                  Plan: {t.plan} | Estado: {t.status.toUpperCase()} | Pasarela: {t.paymentGateway}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingTenantId(t.id);
                                setEditTenantNameInput(t.name);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Editar Nombre</span>
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Active Users List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operadores Registrados ({users.length})</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/30">
                  {users.map((u) => {
                    const isEditing = editingUserId === u.id;
                    
                    return (
                      <div key={u.id} className="p-4 flex flex-col justify-between gap-3 bg-white hover:bg-slate-50/40 transition-all">
                        {isEditing ? (
                          <div className="space-y-3 text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Nombre</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Email</label>
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Rol</label>
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                >
                                  <option value="administrador">Administrador</option>
                                  <option value="vendedor">Vendedor</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Foto de Perfil</label>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="text"
                                    placeholder="https://..."
                                    value={editAvatarUrl}
                                    onChange={(e) => setEditAvatarUrl(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-[10px]"
                                  />
                                  <label className="px-2 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[10px] font-bold cursor-pointer shrink-0 flex items-center space-x-1 transition-all" title="Subir foto desde la PC/Celular">
                                    <ImageIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline">Subir</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleImageFileUpload(e, setEditAvatarUrl)}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Preset avatars for quick pick */}
                            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1">
                                  <Camera className="h-3 w-3 text-indigo-500" />
                                  <span>Elegir Foto Predefinida:</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {PRESET_AVATARS.map((preset, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setEditAvatarUrl(preset.url)}
                                      className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] border transition-all cursor-pointer ${
                                        editAvatarUrl === preset.url
                                          ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold"
                                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      <img src={preset.url} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                                      <span>{preset.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {editAvatarUrl && (
                                <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">Vista previa:</span>
                                  <img src={editAvatarUrl} alt="Preview" className="h-7 w-7 rounded-lg object-cover border border-slate-300" referrerPolicy="no-referrer" />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 flex-1 min-w-0 text-left">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.name}
                                className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs ring-2 ring-indigo-500/10"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.role === "administrador" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              }`}>
                                {u.role === "administrador" ? "AD" : "VD"}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-800">{u.name}</span>
                                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ${
                                  u.role === "administrador" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {u.role}
                                </span>
                                {u.id === activeUserId && (
                                  <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Sesión Activa
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-slate-400 font-mono truncate">{u.email}</span>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end space-x-1.5 shrink-0">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!editName.trim()) {
                                    alert("El nombre no puede estar vacío");
                                    return;
                                  }
                                  await onUpdateUser(u.id, editName, editEmail, editRole, editAvatarUrl);
                                  setEditingUserId(null);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-xs font-bold flex items-center space-x-1"
                                title="Guardar Cambios"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Guardar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg transition-all"
                                title="Cancelar"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setEditName(u.name);
                                  setEditEmail(u.email);
                                  setEditRole(u.role);
                                  setEditAvatarUrl(u.avatarUrl || u.photoUrl || "");
                                }}
                                className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 rounded-lg transition-all flex items-center space-x-1"
                                title="Editar datos y foto de perfil"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-medium hidden sm:inline">Editar / Foto</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg transition-all"
                                title="Dar de baja / Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New User Section */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3.5">
                <div className="flex items-center space-x-2 text-left">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Añadir Nuevo Vendedor / Admin con Foto</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej. Pedro Vendedor"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
                    <input
                      type="email"
                      placeholder="pedro@comercio.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Rol / Permisos *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                    >
                      <option value="vendedor">Vendedor (Sellers)</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Foto de Perfil</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={newUserAvatarUrl}
                        onChange={(e) => setNewUserAvatarUrl(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-mono text-[10px]"
                      />
                      <label className="px-2.5 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center space-x-1 transition-all" title="Subir desde la PC/Celular">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, setNewUserAvatarUrl)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preset Avatars for new user */}
                <div className="text-left space-y-1">
                  <label className="block text-[8.5px] font-bold text-slate-400 uppercase flex items-center space-x-1">
                    <Camera className="h-3 w-3 text-indigo-500" />
                    <span>Seleccionar Foto de Perfil Rápida:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewUserAvatarUrl(preset.url)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] border transition-all ${
                          newUserAvatarUrl === preset.url
                            ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <img src={preset.url} alt="" className="h-4 w-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!newUserName.trim()) {
                      alert("Por favor introduce un nombre para el nuevo personal");
                      return;
                    }
                    await onAddUser(newUserName, newUserEmail, newUserRole, newUserAvatarUrl);
                    setNewUserName("");
                    setNewUserEmail("");
                    setNewUserRole("vendedor");
                    setNewUserAvatarUrl("");
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/15 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Registrar Personal con Foto en este Local</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
      {/* LOGIN AUDIT LOGS MODAL (Registro de Ingresos con Fecha y Hora) */}
      <AnimatePresence>
        {showLoginLogsModal && (
          <motion.div
            key="login-logs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
            >
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
                    <span>Registro de Ingresos de Personal</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 font-mono font-bold px-2 py-0.5 rounded-full border border-sky-500/30 flex items-center space-x-1">
                      <span>🇦🇷 Hora Oficial Argentina (ART)</span>
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Historial de accesos al sistema para Administradores y Vendedores ({currentTenant?.name || "Comercio"})
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {/* Export PDF Button in Header */}
                <button
                  type="button"
                  onClick={() => generateLoginLogsPDF(loginLogs)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center space-x-2 border border-indigo-400/30"
                  title="Generar y descargar informe en formato PDF con la fecha y hora oficial de Argentina"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>Generar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLoginLogsModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
              
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Total Logins */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Ingresos</span>
                    <span className="text-xl font-black text-slate-900 font-mono">{loginLogs.length}</span>
                  </div>
                </div>

                {/* Last Admin Login */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Último Admin</span>
                    <span className="text-xs font-bold text-slate-900 font-mono block">
                      {loginLogs.find(l => l.role === "administrador")?.dateFormatted || "Sin registros"}
                    </span>
                  </div>
                </div>

                {/* Last Seller Login */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Último Vendedor</span>
                    <span className="text-xs font-bold text-slate-900 font-mono block">
                      {loginLogs.find(l => l.role === "vendedor")?.dateFormatted || "Sin registros"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
                {/* Role Filter Pills */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto">
                  <span className="text-[10px] text-slate-400 uppercase font-bold mr-1 hidden md:inline">Filtrar:</span>
                  <button
                    type="button"
                    onClick={() => setLogRoleFilter("todos")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      logRoleFilter === "todos"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Todos ({loginLogs.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogRoleFilter("administrador")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                      logRoleFilter === "administrador"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>Admin ({loginLogs.filter(l => l.role === "administrador").length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogRoleFilter("vendedor")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                      logRoleFilter === "vendedor"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <User className="h-3 w-3" />
                    <span>Vendedores ({loginLogs.filter(l => l.role === "vendedor").length})</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por usuario o fecha..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {(() => {
                  const filteredLogs = loginLogs.filter((log) => {
                    if (logRoleFilter !== "todos" && log.role !== logRoleFilter) return false;
                    if (logSearch.trim()) {
                      const q = logSearch.toLowerCase();
                      const matchUser = log.userName.toLowerCase().includes(q);
                      const matchEmail = log.userEmail.toLowerCase().includes(q);
                      const matchDate = log.dateFormatted.toLowerCase().includes(q);
                      const matchRole = log.role.toLowerCase().includes(q);
                      return matchUser || matchEmail || matchDate || matchRole;
                    }
                    return true;
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="p-10 text-center space-y-3">
                        <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">
                          No hay ingresos registrados con los filtros seleccionados.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                            <th className="py-3 px-4">Fecha y Hora (ARG)</th>
                            <th className="py-3 px-4">Usuario / Operador</th>
                            <th className="py-3 px-4">Rol de Trabajo</th>
                            <th className="py-3 px-4">Dispositivo</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                            <th className="py-3 px-4 text-right">Eliminar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Date & Time */}
                              <td className="py-3 px-4 font-mono text-slate-900 font-bold whitespace-nowrap">
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  <span>{log.dateFormatted}</span>
                                </div>
                              </td>

                              {/* User name / email */}
                              <td className="py-3 px-4">
                                <div>
                                  <span className="font-bold text-slate-800 block">{log.userName}</span>
                                  {log.userEmail && (
                                    <span className="text-[10px] text-slate-400 font-mono block">{log.userEmail}</span>
                                  )}
                                </div>
                              </td>

                              {/* Role */}
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center space-x-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                                  log.role === "administrador"
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {log.role === "administrador" ? (
                                    <Shield className="h-3 w-3 shrink-0" />
                                  ) : (
                                    <User className="h-3 w-3 shrink-0" />
                                  )}
                                  <span>{log.role}</span>
                                </span>
                              </td>

                              {/* Device Info */}
                              <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                                <div className="flex items-center space-x-1">
                                  <Laptop className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{log.deviceInfo || "Navegador Web"}</span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                  <span>Exitoso</span>
                                </span>
                              </td>

                              {/* Action: Delete Single Log */}
                              <td className="py-3 px-4 text-right">
                                {deletingLogId === log.id ? (
                                  <div className="flex items-center justify-end space-x-1">
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (onDeleteSingleLog) {
                                          await onDeleteSingleLog(log.id);
                                        }
                                        setDeletingLogId(null);
                                      }}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                                      title="Confirmar eliminación"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Confirmar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingLogId(null);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingLogId(log.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                    title="Eliminar este registro"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 space-y-3">
              {showConfirmClearAll && (
                <div className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-red-700 text-xs font-bold">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>¿Desea vaciar TODOS los registros de ingresos de este comercio? Acción irreversible.</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (onClearLoginLogs) {
                          await onClearLoginLogs();
                        }
                        setShowConfirmClearAll(false);
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      Sí, Vaciar Todo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmClearAll(false);
                      }}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  {onClearLoginLogs && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirmClearAll(!showConfirmClearAll);
                      }}
                      className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      title="Vaciar todo el registro de ingresos"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Vaciar Registro Completo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => generateLoginLogsPDF(loginLogs)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                </div>

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginLogsModal(false);
                      setShowConfirmClearAll(false);
                      setDeletingLogId(null);
                    }}
                    className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Standalone Edit Tenant Name Modal */}
      {showEditTenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display uppercase tracking-wider">Cambiar Nombre del Comercio</h3>
                  <p className="text-[10px] text-slate-400">Modifica la denominación del comercio en la red multi-inquilino</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditTenantModal(false);
                  setEditingTenantId(null);
                }}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Comercio Seleccionado
                </label>
                <select
                  value={editingTenantId || activeTenantId}
                  onChange={(e) => {
                    const selected = tenants.find(t => t.id === e.target.value);
                    setEditingTenantId(e.target.value);
                    if (selected) setEditTenantNameInput(selected.name);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nuevo Nombre del Comercio *
                </label>
                <input
                  type="text"
                  value={editTenantNameInput}
                  onChange={(e) => setEditTenantNameInput(e.target.value)}
                  placeholder="Ej. JM Software, Calzados El Sol..."
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-xs"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowEditTenantModal(false);
                  setEditingTenantId(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editTenantNameInput.trim()) {
                    alert("Por favor ingrese un nombre válido");
                    return;
                  }
                  const targetId = editingTenantId || activeTenantId;
                  if (onUpdateTenantName) {
                    await onUpdateTenantName(targetId, editTenantNameInput.trim());
                  }
                  setShowEditTenantModal(false);
                  setEditingTenantId(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Guardar Nombre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Quick Profile Photo Change Modal */}
      {quickPhotoUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display uppercase tracking-wider">Cambiar Foto de Perfil</h3>
                  <p className="text-[10px] text-slate-400">{quickPhotoUser.name} ({quickPhotoUser.role})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPhotoUser(null)}
                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Image Preview */}
              <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {quickPhotoUrl ? (
                  <img
                    src={quickPhotoUrl}
                    alt="Preview"
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md ring-4 ring-indigo-500/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`h-16 w-16 rounded-2xl border-2 flex items-center justify-center font-black text-lg shadow-md shrink-0 ${
                    quickPhotoUser.role === "administrador" ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  }`}>
                    {quickPhotoUser.role === "administrador" ? "AD" : "VD"}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{quickPhotoUser.name}</h4>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-block mt-0.5 ${
                    quickPhotoUser.role === "administrador" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {quickPhotoUser.role}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Selecciona una foto o sube un archivo desde tu dispositivo.</p>
                </div>
              </div>

              {/* Upload file button */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  1. Cargar archivo desde tu Equipo / Cámara
                </label>
                <label className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl font-bold text-xs cursor-pointer transition-all">
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                  <span>Examinar o tomar foto de la cámara</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFileUpload(e, setQuickPhotoUrl)}
                  />
                </label>
              </div>

              {/* Image URL input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  2. O pegar enlace/URL de imagen
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickPhotoUrl}
                  onChange={(e) => setQuickPhotoUrl(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-xs"
                />
              </div>

              {/* Preset Gallery */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center space-x-1">
                  <Camera className="h-3.5 w-3.5 text-indigo-500" />
                  <span>3. O elegir avatar predefinido</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-xl">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickPhotoUrl(preset.url)}
                      className={`flex items-center space-x-2 p-1.5 rounded-lg text-left text-[11px] border transition-all cursor-pointer ${
                        quickPhotoUrl === preset.url
                          ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <img src={preset.url} alt="" className="h-6 w-6 rounded-md object-cover shrink-0" referrerPolicy="no-referrer" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setQuickPhotoUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!quickPhotoUser) return;
                  await onUpdateUser(
                    quickPhotoUser.id,
                    quickPhotoUser.name,
                    quickPhotoUser.email,
                    quickPhotoUser.role,
                    quickPhotoUrl
                  );
                  setQuickPhotoUser(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Guardar Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
