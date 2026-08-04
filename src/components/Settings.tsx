import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Building2, 
  QrCode, 
  Users, 
  Database, 
  ShieldCheck, 
  Copy, 
  Check, 
  Save, 
  UserPlus, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  RotateCcw, 
  Lock, 
  KeyRound,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  FileText
} from "lucide-react";
import { Tenant, UserRole, User, LoginLog } from "../types";

interface SettingsProps {
  activeTenantId: string;
  tenants: Tenant[];
  onUpdateTenantName?: (tenantId: string, newName: string) => Promise<void> | void;
  users: User[];
  activeUserId: string;
  onUserChange: (id: string) => void;
  onAddUser: (name: string, email: string, role: UserRole, avatarUrl?: string, password?: string) => Promise<void>;
  onUpdateUser: (id: string, name: string, email: string, role: UserRole, avatarUrl?: string, password?: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  loginLogs?: LoginLog[];
  onClearDatabase?: () => Promise<void>;
  onRestoreDatabase?: (data: any) => Promise<void>;
  onSeedDemoDatabase?: () => Promise<void>;
  activeRole: UserRole;
  onOpenScamAlert?: () => void;
}

export default function Settings({
  activeTenantId,
  tenants,
  onUpdateTenantName,
  users = [],
  activeUserId,
  onUserChange,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  loginLogs = [],
  onClearDatabase,
  onRestoreDatabase,
  onSeedDemoDatabase,
  activeRole,
  onOpenScamAlert
}: SettingsProps) {
  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  const [activeTab, setActiveTab] = useState<"general" | "qr" | "users" | "database" | "security">("general");

  // General Business Settings State
  const [businessName, setBusinessName] = useState(currentTenant?.name || "J&Z Indumentaria");
  const [cuit, setCuit] = useState(() => localStorage.getItem("jz_cuit") || "20-38492019-8");
  const [address, setAddress] = useState(() => localStorage.getItem("jz_address") || "Av. Corrientes 1450, CABA");
  const [phone, setPhone] = useState(() => localStorage.getItem("jz_phone") || "+54 11 4829-1029");
  const [savedGeneral, setSavedGeneral] = useState(false);

  // QR / Payment Settings State
  const [cbuAlias, setCbuAlias] = useState(() => localStorage.getItem("jz_cbu_alias") || "JZ.INDUMENTARIA.MP");
  const [cbuNumber, setCbuNumber] = useState(() => localStorage.getItem("jz_cbu_number") || "0000003100084729103847");
  const [accountOwner, setAccountOwner] = useState(() => localStorage.getItem("jz_account_owner") || "J&Z SRL / Mercado Pago");
  const [savedQr, setSavedQr] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState(false);

  // User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNameInput, setUserNameInput] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [userRoleInput, setUserRoleInput] = useState<UserRole>("vendedor");
  const [userAvatarInput, setUserAvatarInput] = useState("");
  const [userPasswordInput, setUserPasswordInput] = useState("");

  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("vendedor");
  const [newUserAvatar, setNewUserAvatar] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Save General Business Data
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTenantName && currentTenant) {
      await onUpdateTenantName(currentTenant.id, businessName);
    }
    localStorage.setItem("jz_cuit", cuit);
    localStorage.setItem("jz_address", address);
    localStorage.setItem("jz_phone", phone);
    setSavedGeneral(true);
    setTimeout(() => setSavedGeneral(false), 2500);
  };

  // Save QR Payment Data
  const handleSaveQr = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("jz_cbu_alias", cbuAlias);
    localStorage.setItem("jz_cbu_number", cbuNumber);
    localStorage.setItem("jz_account_owner", accountOwner);
    setSavedQr(true);
    setTimeout(() => setSavedQr(false), 2500);
  };

  // User Actions
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    await onAddUser(newUserName, newUserEmail, newUserRole, newUserAvatar, newUserPassword);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserAvatar("");
    setNewUserPassword("");
    setShowNewUserModal(false);
  };

  const handleStartEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserNameInput(u.name);
    setUserEmailInput(u.email);
    setUserRoleInput(u.role);
    setUserAvatarInput(u.avatarUrl || "");
    setUserPasswordInput(u.password || "");
  };

  const handleSaveUserEdit = async (id: string) => {
    await onUpdateUser(id, userNameInput, userEmailInput, userRoleInput, userAvatarInput, userPasswordInput);
    setEditingUserId(null);
  };

  const copyAlias = () => {
    navigator.clipboard.writeText(cbuAlias);
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch("/api/database/backup", {
        headers: { "x-tenant-id": activeTenantId }
      });
      if (!res.ok) throw new Error("Error al descargar");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Respaldo_${businessName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Error al descargar respaldo de la base de datos.");
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (onRestoreDatabase) {
          await onRestoreDatabase(parsed);
          alert("✅ Base de datos restaurada correctamente.");
        }
      } catch (err) {
        alert("Archivo JSON inválido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-900 font-display">Configuración del Sistema</h2>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {currentTenant?.name || "Comercio"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá los datos del negocio, cobros por QR, usuarios de caja, respaldos y auditoría.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Datos del Negocio</span>
        </button>

        <button
          onClick={() => setActiveTab("qr")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "qr"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <QrCode className="h-4 w-4 text-blue-500" />
          <span>Cobros QR / Mercado Pago</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Users className="h-4 w-4 text-emerald-500" />
          <span>Usuarios y Vendedores</span>
        </button>

        <button
          onClick={() => setActiveTab("database")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "database"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Database className="h-4 w-4 text-indigo-500" />
          <span>Base de Datos y Respaldos</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-cyan-500" />
          <span>Auditoría e Ingresos</span>
        </button>
      </div>

      {/* Tab 1: Datos Generales */}
      {activeTab === "general" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Perfil e Identidad Comercial</h3>
              <p className="text-xs text-slate-500">
                Esta información figurará en las facturas PDF y tickets impresos para tus clientes.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Comercial del Negocio
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CUIT / DNI del Titular
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="20-38492019-8"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección Física / Sucursal
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Av. Corrientes 1450, CABA"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 11 4829-1029"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Datos Generales</span>
              </button>
              {savedGeneral && (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-in fade-in">
                  <Check className="h-4 w-4" />
                  <span>¡Cambios guardados con éxito!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Configuración QR y Mercado Pago */}
      {activeTab === "qr" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Configuración de Cobro Digital por QR</h3>
              <p className="text-xs text-slate-500">
                Definí el Alias o CBU de Mercado Pago para generar de forma automática los códigos QR en el módulo de Nueva Venta.
              </p>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <QrCode className="h-6 w-6" />
            </div>
          </div>

          <form onSubmit={handleSaveQr} className="space-y-4 max-w-2xl">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alias de Mercado Pago / Banco
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={cbuAlias}
                    onChange={(e) => setCbuAlias(e.target.value)}
                    placeholder="JZ.INDUMENTARIA.MP"
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                  />
                  <button
                    type="button"
                    onClick={copyAlias}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedAlias ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedAlias ? "¡Copiado!" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  CBU / CVU (22 dígitos)
                </label>
                <input
                  type="text"
                  value={cbuNumber}
                  onChange={(e) => setCbuNumber(e.target.value)}
                  placeholder="0000003100084729103847"
                  maxLength={22}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={accountOwner}
                  onChange={(e) => setAccountOwner(e.target.value)}
                  placeholder="J&Z SRL / Mercado Pago"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Configuración QR</span>
              </button>
              {savedQr && (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-in fade-in">
                  <Check className="h-4 w-4" />
                  <span>¡Alias de cobro actualizado!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Gestión de Usuarios */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal y Vendedores de Caja</h3>
              <p className="text-xs text-slate-500">
                Gestioná los operadores autorizados para cobrar y vender en tu local.
              </p>
            </div>
            {activeRole === "administrador" && (
              <button
                onClick={() => setShowNewUserModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer self-start"
              >
                <UserPlus className="h-4 w-4" />
                <span>Nuevo Vendedor / Admin</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((u) => {
              const isSelected = u.id === activeUserId;
              const isEditing = editingUserId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-800 shadow-md"
                      : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-white"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-3 text-slate-800">
                      <div className="text-xs font-bold text-indigo-600">Editando Usuario</div>
                      <input
                        type="text"
                        value={userNameInput}
                        onChange={(e) => setUserNameInput(e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                      />
                      <input
                        type="email"
                        value={userEmailInput}
                        onChange={(e) => setUserEmailInput(e.target.value)}
                        placeholder="Email de ingreso"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={userRoleInput}
                          onChange={(e) => setUserRoleInput(e.target.value as UserRole)}
                          className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                        >
                          <option value="vendedor">Vendedor</option>
                          <option value="administrador">Administrador</option>
                        </select>
                        <input
                          type="text"
                          value={userPasswordInput}
                          onChange={(e) => setUserPasswordInput(e.target.value)}
                          placeholder="Contraseña"
                          className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveUserEdit(u.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUserId(null)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            u.role === "administrador" ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                          }`}>
                            {u.role === "administrador" ? "AD" : "VD"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                              {u.name}
                            </h4>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              u.role === "administrador" 
                                ? (isSelected ? "bg-indigo-500 text-white" : "bg-indigo-100 text-indigo-800")
                                : (isSelected ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800")
                            }`}>
                              {u.role}
                            </span>
                          </div>
                          <p className={`text-[10.5px] font-mono truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                            {u.email}
                          </p>
                          <p className={`text-[9.5px] font-mono ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                            Clave: {u.password || "123456"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {!isSelected && (
                          <button
                            onClick={() => onUserChange(u.id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                          >
                            Usar
                          </button>
                        )}
                        {activeRole === "administrador" && (
                          <>
                            <button
                              onClick={() => handleStartEditUser(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isSelected ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-200 text-slate-600"
                              }`}
                              title="Editar usuario"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {users.length > 1 && (
                              <button
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Base de Datos */}
      {activeTab === "database" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Base de Datos y Respaldos JSON</h3>
              <p className="text-xs text-slate-500">
                Descargá una copia de seguridad con todos los artículos, clientes y ventas, o restáurala cuando lo necesites.
              </p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Database className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Descargar Backup */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl w-fit">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Descargar Copia de Seguridad</h4>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Guarda un archivo .JSON en tu computadora con toda la información.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Descargar Respaldo JSON
              </button>
            </div>

            {/* Restaurar Backup */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl w-fit">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Restaurar desde Respaldo</h4>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Carga un archivo .JSON descargado previamente.
                </p>
              </div>
              <label className="block w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                <span>Seleccionar Archivo JSON</span>
                <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
              </label>
            </div>

            {/* Cargar Datos Demo / Vaciar */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl w-fit">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Cargar Datos de Ejemplo</h4>
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Poblá el sistema con productos y clientes de demostración.
                </p>
              </div>
              {onSeedDemoDatabase && (
                <button
                  onClick={onSeedDemoDatabase}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Cargar Demo Inicial
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Seguridad e Ingresos */}
      {activeTab === "security" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Auditoría de Ingresos y Seguridad</h3>
              <p className="text-xs text-slate-500">
                Historial de ingresos de administradores y vendedores de caja con fecha y hora exacta.
              </p>
            </div>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold">
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Usuario / Operador</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Dispositivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {loginLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No hay registros de ingresos archivados aún.
                    </td>
                  </tr>
                ) : (
                  loginLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{log.dateFormatted}</td>
                      <td className="p-3 font-bold text-slate-900">{log.userName}</td>
                      <td className="p-3">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                          log.role === "administrador" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{log.deviceInfo || "Navegador Web"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Usuario */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Agregar Nuevo Operador / Vendedor</h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Marcos Vendedor"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email de Ingreso</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="vendedor@comercio.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rol de Caja</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Ej: Vend-9482"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
