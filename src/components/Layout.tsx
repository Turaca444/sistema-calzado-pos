import React from "react";
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
  Settings
} from "lucide-react";
import { motion } from "motion/react";
import { Tenant, UserRole, User as UserType } from "../types";

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
  users: UserType[];
  activeUserId: string;
  onUserChange: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole) => Promise<void>;
  onUpdateUser: (id: string, name: string, email: string, role: UserRole) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
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
  users = [],
  activeUserId,
  onUserChange,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}: LayoutProps) {
  
  const [showManageUsers, setShowManageUsers] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editRole, setEditRole] = React.useState<UserRole>("vendedor");
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState<UserRole>("vendedor");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Artículos", icon: ShoppingBag, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: "bg-amber-500" },
    { id: "customers", label: "Clientes", icon: Users, badge: pendingDebtsCount > 0 ? pendingDebtsCount : undefined, badgeColor: "bg-red-500" },
    { id: "sales-new", label: "Nueva Venta", icon: PlusCircle, highlight: true },
    { id: "history", label: "Historial", icon: History },
    { id: "api-docs", label: "API Sandbox", icon: Terminal },
  ];

  // Resolve active tenant details
  const currentTenant = tenants.find(t => t.id === activeTenantId);
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
            <h1 className="text-base font-black font-display tracking-tight text-white leading-tight">J&Z SaaS Engine</h1>
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
            <label className="block text-[9px] font-bold text-slate-400 uppercase">Comercio Activo (Tenant)</label>
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
            
            <div className="flex items-center justify-between text-[10px] bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40">
              <span className="text-slate-400">Rol activo:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                activeRole === "administrador" ? "text-indigo-400 bg-indigo-950/40" : "text-emerald-400 bg-emerald-950/40"
              }`}>
                {activeRole.toUpperCase()}
              </span>
            </div>
            
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
              {currentTenant ? currentTenant.name : "J&Z SaaS"}
            </span>
            {lowStockCount > 0 && (
              <span className="flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>{lowStockCount} artículos críticos</span>
              </span>
            )}
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
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center font-extrabold text-xs shadow-sm ${
              activeUser?.role === "administrador"
                ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}>
              {activeUser?.role === "administrador" ? "AD" : "VD"}
            </div>
          </div>
        </header>

        {/* Content canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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
              
              {/* Active Users List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operadores Registrados ({users.length})</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/30">
                  {users.map((u) => {
                    const isEditing = editingUserId === u.id;
                    
                    return (
                      <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/40 transition-all">
                        {isEditing ? (
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
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
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 flex-1 min-w-0 text-left">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === "administrador" ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}>
                              {u.role === "administrador" ? "AD" : "VD"}
                            </div>
                            <div className="truncate">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-800">{u.name}</span>
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
                                  await onUpdateUser(u.id, editName, editEmail, editRole);
                                  setEditingUserId(null);
                                }}
                                className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-lg transition-all"
                                title="Guardar Cambios"
                              >
                                <Check className="h-3.5 w-3.5" />
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
                                }}
                                className="p-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 rounded-lg transition-all"
                                title="Editar nombre/email"
                              >
                                <Edit className="h-3.5 w-3.5" />
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
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Añadir Nuevo Vendedor / Admin</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
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
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Rol / Permisos</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                    >
                      <option value="vendedor">Vendedor (Sellers)</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!newUserName.trim()) {
                      alert("Por favor introduce un nombre para el nuevo personal");
                      return;
                    }
                    await onAddUser(newUserName, newUserEmail, newUserRole);
                    setNewUserName("");
                    setNewUserEmail("");
                    setNewUserRole("vendedor");
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/15 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Registrar Personal en este Local</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
