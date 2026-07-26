import React, { useState, useEffect } from "react";
import { Tenant, User, UserRole } from "../types";
import { 
  Shield, 
  User as UserIcon, 
  Lock, 
  Store, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  KeyRound,
  ShieldCheck,
  ShoppingBag,
  Info
} from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  tenants: Tenant[];
  users: User[];
  onLogin: (tenantId: string, role: UserRole, userId: string, userName?: string, userEmail?: string) => void;
  initialTenantId?: string;
}

export default function Login({ tenants, users, onLogin, initialTenantId }: LoginProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    initialTenantId || tenants[0]?.id || "tenant_jz"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>("administrador");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Get users for the selected tenant
  const tenantUsers = users.filter((u) => u.tenantId === selectedTenantId);
  const filteredUsersByRole = tenantUsers.filter((u) => u.role === selectedRole);

  // Auto select user when tenant or role changes
  useEffect(() => {
    if (filteredUsersByRole.length > 0) {
      setSelectedUserId(filteredUsersByRole[0].id);
    } else if (tenantUsers.length > 0) {
      setSelectedUserId(tenantUsers[0].id);
    } else {
      setSelectedUserId("");
    }
  }, [selectedTenantId, selectedRole, users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      setError("Por favor, seleccione un comercio o sucursal.");
      return;
    }
    
    // Find active or matching user
    let finalUserId = selectedUserId;
    if (!finalUserId && filteredUsersByRole.length > 0) {
      finalUserId = filteredUsersByRole[0].id;
    }

    const matchedUser = users.find((u) => u.id === finalUserId);
    const userName = matchedUser?.name || (selectedRole === "administrador" ? "Administrador General" : "Vendedor de Caja");
    const userEmail = matchedUser?.email || (selectedRole === "administrador" ? "admin@comercio.com" : "vendedor@comercio.com");

    onLogin(selectedTenantId, selectedRole, finalUserId, userName, userEmail);
  };

  const currentTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-4xl w-full bg-slate-950/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl grid grid-cols-1 md:grid-cols-12 relative z-10"
      >
        {/* Left Side: Brand & Role Information Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 text-white">
          <div className="space-y-6">
            {/* Header / Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2.5 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-black font-display tracking-tight text-white leading-tight">JM SOFTWARE</h1>
                <p className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase">Portal de Ingreso Unificado</p>
              </div>
            </div>

            {/* System Info */}
            <div className="space-y-3">
              <h2 className="text-xl font-black tracking-tight leading-snug">
                Selecciona tu Rol de Trabajo
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                El sistema ajustará dinámicamente los módulos de venta, inventario y seguridad según tu perfil de usuario.
              </p>
            </div>

            {/* Dynamic Role Explanation Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Permisos del Rol</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  selectedRole === "administrador"
                    ? "bg-indigo-950 text-indigo-300 border border-indigo-800/50"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
                }`}>
                  {selectedRole === "administrador" ? "Administrador" : "Vendedor"}
                </span>
              </div>

              {selectedRole === "administrador" ? (
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Acceso Total:</strong> Finanzas, balances de caja y reportes de rentabilidad.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Gestión de Catálogo:</strong> Alta, baja y edición ilimitada de artículos y talles.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Administración de Personal:</strong> Registro de vendedores y control de usuarios.</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Punto de Venta Rápido:</strong> Registrar ventas al contado, transferencia y fiado.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Consulta de Stock:</strong> Ver precios, talles y clientes registrados.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Modo Seguro:</strong> Restricción para la eliminación de ventas y productos.</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>SaaS Version 3.2</span>
            <span className="text-indigo-400 font-semibold">Servidor Activo (Puerto 3000)</span>
          </div>
        </div>

        {/* Right Side: Interactive Login Form */}
        <div className="md:col-span-7 p-6 md:p-8 bg-slate-950 flex flex-col justify-center text-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header */}
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Formulario de Ingreso</h3>
              <p className="text-xs text-slate-400 mt-1">
                Elige tu perfil y comercio para iniciar sesión en la plataforma
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                <Info className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. ROLE SELECTOR (ADMINISTRADOR vs VENDEDOR) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Selecciona tu Rol *
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* ADMINISTRADOR CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("administrador");
                    setError("");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                    selectedRole === "administrador"
                      ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-500/30"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${selectedRole === "administrador" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    {selectedRole === "administrador" && (
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-white uppercase">Administrador</span>
                    <span className="text-[10px] text-slate-400 leading-snug">Control completo del comercio</span>
                  </div>
                </button>

                {/* VENDEDOR CARD */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("vendedor");
                    setError("");
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                    selectedRole === "vendedor"
                      ? "bg-emerald-600/15 border-emerald-500 text-white shadow-lg shadow-emerald-600/10 ring-2 ring-emerald-500/30"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${selectedRole === "vendedor" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                      <UserIcon className="h-5 w-5" />
                    </div>
                    {selectedRole === "vendedor" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-white uppercase">Vendedor</span>
                    <span className="text-[10px] text-slate-400 leading-snug">Cobro en caja y ventas</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. STORE / TENANT SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Comercio / Local *
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — ({t.plan})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. USER PROFILE SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Nombre de Usuario / Operador *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                >
                  {filteredUsersByRole.length > 0 ? (
                    filteredUsersByRole.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  ) : (
                    tenantUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.role.toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {filteredUsersByRole.length === 0 && tenantUsers.length > 0 && (
                <p className="text-[10px] text-amber-400 font-medium italic">
                  * No hay usuarios con rol {selectedRole} específicos en este comercio. Se asignará el usuario seleccionado.
                </p>
              )}
            </div>

            {/* DEMO / PASSWORD OPTIONAL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                4. Clave de Acceso / PIN (Demo)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  placeholder="•••••••• (Ingreso rápido demo sin contraseña)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs text-white transition-all shadow-lg flex items-center justify-center space-x-2 ${
                selectedRole === "administrador"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
              }`}
            >
              <span>Ingresar como {selectedRole.toUpperCase()}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Quick preset buttons */}
            <div className="pt-2 border-t border-slate-800/60 text-center space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Botones de Acceso Rápido Demo</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const jz = tenants.find((t) => t.id === "tenant_jz") || tenants[0];
                    const adminUser = users.find((u) => u.tenantId === jz.id && u.role === "administrador");
                    onLogin(
                      jz.id, 
                      "administrador", 
                      adminUser?.id || "user_jz_admin", 
                      adminUser?.name || "Admin J&Z", 
                      adminUser?.email || "turacam2014@gmail.com"
                    );
                  }}
                  className="py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center space-x-1"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Entrar como Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const jz = tenants.find((t) => t.id === "tenant_jz") || tenants[0];
                    const vendUser = users.find((u) => u.tenantId === jz.id && u.role === "vendedor");
                    onLogin(
                      jz.id, 
                      "vendedor", 
                      vendUser?.id || "user_jz_vendedor", 
                      vendUser?.name || "Sofía Vendedora", 
                      vendUser?.email || "sofia.vende@jz.com"
                    );
                  }}
                  className="py-2 px-3 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center space-x-1"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Entrar como Vendedor</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
