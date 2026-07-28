import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import Customers from "./components/Customers";
import SalesNew from "./components/SalesNew";
import History from "./components/History";
import APIDocs from "./components/APIDocs";
import Login from "./components/Login";
import { Product, Customer, Sale, Tenant, UserRole, User, LoginLog } from "./types";
import { 
  CreditCard, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Coins
} from "lucide-react";
import { motion } from "motion/react";

export default function App() {
  const [currentView, setView] = useState<string>("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("saas_is_logged_in") === "true";
  });
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // SaaS Multi-tenant States
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem("saas_tenant_id") || "tenant_jz";
  });
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return (localStorage.getItem("saas_user_role") as UserRole) || "administrador";
  });
  
  // User/Seller management states
  const [users, setUsers] = useState<User[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem("saas_active_user_id") || "";
  });

  const handleLogin = async (
    tenantId: string, 
    role: UserRole, 
    userId: string, 
    userName?: string, 
    userEmail?: string
  ) => {
    setActiveTenantId(tenantId);
    localStorage.setItem("saas_tenant_id", tenantId);
    
    setActiveRole(role);
    localStorage.setItem("saas_user_role", role);
    
    if (userId) {
      setActiveUserId(userId);
      localStorage.setItem("saas_active_user_id", userId);
    }
    
    setIsLoggedIn(true);
    localStorage.setItem("saas_is_logged_in", "true");
    setView("dashboard");

    // Post new login audit log with current date and time
    try {
      const payload = {
        userId: userId || `user_${Date.now()}`,
        userName: userName || (role === "administrador" ? "Administrador General" : "Vendedor de Caja"),
        userEmail: userEmail || (role === "administrador" ? "admin@comercio.com" : "vendedor@comercio.com"),
        role,
        tenantId,
        deviceInfo: "Navegador Web (" + (navigator.userAgent.includes("Mobile") ? "Móvil" : "PC") + ")"
      };

      const res = await fetch("/api/login-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newLog: LoginLog = await res.json();
        setLoginLogs((prev) => [newLog, ...prev]);
      }
    } catch (err) {
      console.error("Error al registrar ingreso de usuario:", err);
    }
  };

  const handleClearLoginLogs = async () => {
    setLoginLogs([]);
    try {
      await fetch("/api/login-logs", {
        method: "DELETE",
        headers: { "x-tenant-id": activeTenantId }
      });
    } catch (err) {
      console.error("Error al vaciar registro de ingresos:", err);
    }
  };

  const handleDeleteSingleLog = async (id: string) => {
    setLoginLogs((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/login-logs/${id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": activeTenantId }
      });
    } catch (err) {
      console.error("Error al eliminar registro de ingreso individual:", err);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("saas_is_logged_in", "false");
  };
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  
  // Billing Block State (SaaS Lockout)
  const [billingError, setBillingError] = useState<{
    error: string;
    tenantId: string;
    tenantName: string;
    plan: string;
    monthlyPrice: number;
    paymentGateway: string;
    suspended?: boolean;
  } | null>(null);

  // Simulated Checkout Portal States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<"mercado_pago" | "stripe">("mercado_pago");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");

  // App initialization and polling whenever active Tenant or Role changes
  useEffect(() => {
    fetchTenants();
  }, [activeTenantId]);

  useEffect(() => {
    fetchData();
  }, [activeTenantId, activeRole]);

  // Load SaaS tenants and resolve current active tenant object
  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const data: Tenant[] = await res.json();
        setTenants(data);
        const active = data.find((t) => t.id === activeTenantId);
        setActiveTenant(active || null);
      }
    } catch (err) {
      console.error("Error al cargar comercios (tenants):", err);
    }
  };

  // Load SaaS tenant users
  const fetchUsers = async () => {
    try {
      const headers = { "x-tenant-id": activeTenantId };
      const res = await fetch("/api/users", { headers });
      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);
        
        // Validate or select activeUserId
        const stillExists = data.some((u) => u.id === activeUserId);
        if (!stillExists && data.length > 0) {
          const matching = data.find((u) => u.role === activeRole) || data[0];
          setActiveUserId(matching.id);
          localStorage.setItem("saas_active_user_id", matching.id);
          if (matching.role !== activeRole) {
            setActiveRole(matching.role);
            localStorage.setItem("saas_user_role", matching.role);
          }
        } else if (stillExists) {
          const current = data.find((u) => u.id === activeUserId);
          if (current && current.role !== activeRole) {
            setActiveRole(current.role);
            localStorage.setItem("saas_user_role", current.role);
          }
        }
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  // Load SaaS tenant login history logs
  const fetchLoginLogs = async () => {
    try {
      const headers = { "x-tenant-id": activeTenantId };
      const res = await fetch("/api/login-logs", { headers });
      if (res.ok) {
        const data: LoginLog[] = await res.json();
        setLoginLogs(data);
      }
    } catch (err) {
      console.error("Error al cargar historial de ingresos:", err);
    }
  };

  // Main data fetch, applying headers to isolate data and intercepting 402 subscription suspensions
  const fetchData = async () => {
    setBillingError(null);
    try {
      const headers = {
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      };

      const [resProd, resCust, resSales] = await Promise.all([
        fetch("/api/products", { headers }),
        fetch("/api/customers", { headers }),
        fetch("/api/sales", { headers })
      ]);

      // Check for 402 Payment Required
      if (resProd.status === 402 || resCust.status === 402 || resSales.status === 402) {
        const blockedRes = resProd.status === 402 ? resProd : (resCust.status === 402 ? resCust : resSales);
        const payload = await blockedRes.json();
        setBillingError(payload);
        return;
      }

      if (resProd.ok && resCust.ok && resSales.ok) {
        const prodData = await resProd.json();
        const custData = await resCust.json();
        const salesData = await resSales.json();

        setProducts(prodData);
        setCustomers(custData);
        setSales(salesData);
      }

      await Promise.all([fetchUsers(), fetchLoginLogs()]);
    } catch (err) {
      console.error("Error al sincronizar datos:", err);
    }
  };

  // SaaS Tenant Selector Handler
  const handleTenantChange = (id: string) => {
    setActiveTenantId(id);
    localStorage.setItem("saas_tenant_id", id);
    setView("dashboard");
  };

  // SaaS Role Selector Handler
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    localStorage.setItem("saas_user_role", role);
    const matchedUser = users.find((u) => u.role === role);
    if (matchedUser) {
      setActiveUserId(matchedUser.id);
      localStorage.setItem("saas_active_user_id", matchedUser.id);
    }
  };

  // Add User handler
  const handleAddUser = async (name: string, email: string, role: UserRole, avatarUrl?: string) => {
    try {
      const headers = {
        "x-tenant-id": activeTenantId,
        "Content-Type": "application/json"
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email, role, avatarUrl })
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Error al añadir usuario");
      }
    } catch (err) {
      console.error("Error al añadir usuario:", err);
    }
  };

  // Update User handler
  const handleUpdateUser = async (id: string, name: string, email: string, role: UserRole, avatarUrl?: string) => {
    try {
      const headers = {
        "x-tenant-id": activeTenantId,
        "Content-Type": "application/json"
      };
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name, email, role, avatarUrl })
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Error al actualizar usuario");
      }
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
    }
  };

  // Delete User handler
  const handleDeleteUser = async (id: string) => {
    try {
      const headers = {
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      };
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Error al eliminar usuario");
      }
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  // Switch Active User handler
  const handleUserChange = (userId: string) => {
    const userObj = users.find((u) => u.id === userId);
    if (userObj) {
      setActiveUserId(userId);
      localStorage.setItem("saas_active_user_id", userId);
      setActiveRole(userObj.role);
      localStorage.setItem("saas_user_role", userObj.role);
    }
  };

  // Toggle active / suspended status of a tenant manually (Excellent for demonstrating block behavior)
  const handleToggleTenantStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/tenants/${id}/toggle-status`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchTenants();
        await fetchData();
      }
    } catch (err) {
      console.error("Error al cambiar estado de comercio:", err);
    }
  };

  // Update Tenant Name handler
  const handleUpdateTenantName = async (tenantId: string, newName: string) => {
    if (!newName || !newName.trim()) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        const updated: Tenant = await res.json();
        setTenants((prev) => prev.map((t) => (t.id === tenantId ? updated : t)));
        if (tenantId === activeTenantId) {
          setActiveTenant(updated);
        }
      } else {
        const err = await res.json();
        alert(err.error || "Error al actualizar el nombre del comercio");
      }
    } catch (err) {
      console.error("Error al actualizar el nombre del comercio:", err);
    }
  };

  // Handle subscription payment simulator (Automating Mercado Pago / Stripe recurring payment)
  const handleProcessSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenantId) return;

    setPaymentLoading(true);
    try {
      const res = await fetch(`/api/tenants/${activeTenantId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName,
          cardNumber,
          gateway: checkoutGateway
        })
      });

      if (res.ok) {
        setPaymentSuccess(true);
        setTimeout(async () => {
          setShowCheckout(false);
          setPaymentSuccess(false);
          setCardName("");
          setCardNumber("");
          setCardExpiry("");
          setCardCVV("");
          
          // Refresh both the tenants status and data state
          await fetchTenants();
          await fetchData();
        }, 2000);
      }
    } catch (err) {
      console.error("Error en simulación de pasarela:", err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // API Callbacks / Mutators (All injected with SaaS Headers)
  const handleAddProduct = async (prodData: Omit<Product, "id" | "tenantId">) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      },
      body: JSON.stringify(prodData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al agregar artículo");
    }
    const newProd = await res.json();
    setProducts((prev) => [...prev, newProd]);
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al actualizar artículo");
    }
    const updatedProd = await res.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? updatedProd : p)));
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: {
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al eliminar artículo");
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCustomer = async (custData: { name: string; email?: string; phone?: string }) => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      },
      body: JSON.stringify(custData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al registrar cliente");
    }
    const newCust = await res.json();
    setCustomers((prev) => [...prev, newCust]);
  };

  const handlePayDebt = async (id: string, amount: number) => {
    const res = await fetch(`/api/customers/${id}/pay-debt`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al procesar pago");
    }
    await fetchData();
  };

  const handleDeleteCustomer = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`, {
      method: "DELETE",
      headers: {
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al eliminar cliente");
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddSale = async (saleData: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: "contado" | "transferencia" | "cuenta_corriente";
  }) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole,
        "x-user-id": activeUserId
      },
      body: JSON.stringify(saleData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al registrar la venta");
    }

    const data = await res.json();
    await fetchData();
    return data;
  };

  const handleDeleteSale = async (id: string) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: "DELETE",
      headers: {
        "x-tenant-id": activeTenantId,
        "x-user-role": activeRole
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Fallo al eliminar transacción");
    }
    await fetchData();
  };

  // Badge counters
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const pendingDebtsCount = customers.filter((c) => c.debt > 0).length;

  // Render the core app views
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard 
            products={products} 
            customers={customers} 
            sales={sales} 
            users={users}
            setView={setView} 
          />
        );
      case "products":
        return (
          <Products
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case "customers":
        return (
          <Customers
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onPayDebt={handlePayDebt}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case "sales-new":
        return (
          <SalesNew
            products={products}
            customers={customers}
            onAddSale={handleAddSale}
            setView={setView}
          />
        );
      case "history":
        return <History sales={sales} customers={customers} onDeleteSale={handleDeleteSale} />;
      case "api-docs":
        return <APIDocs />;
      default:
        return (
          <Dashboard 
            products={products} 
            customers={customers} 
            sales={sales} 
            users={users}
            setView={setView} 
          />
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <Login
        tenants={tenants}
        users={users}
        onLogin={handleLogin}
        initialTenantId={activeTenantId}
      />
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      setView={setView} 
      lowStockCount={lowStockCount}
      pendingDebtsCount={pendingDebtsCount}
      activeTenantId={activeTenantId}
      activeRole={activeRole}
      tenants={tenants}
      onTenantChange={handleTenantChange}
      onRoleChange={handleRoleChange}
      onToggleTenantStatus={handleToggleTenantStatus}
      onUpdateTenantName={handleUpdateTenantName}
      users={users}
      activeUserId={activeUserId}
      onUserChange={handleUserChange}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      onLogout={handleLogout}
      loginLogs={loginLogs}
      onClearLoginLogs={handleClearLoginLogs}
      onDeleteSingleLog={handleDeleteSingleLog}
    >
      {/* If Tenant subscription is suspended, display the beautiful paywall lockout block */}
      {billingError ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="max-w-2xl w-full bg-white rounded-3xl border border-red-100 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Lockout Alert */}
            <div className="bg-gradient-to-r from-red-500 to-amber-600 p-8 text-white flex flex-col items-center relative">
              <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm">
                SaaS Security Shield
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 mb-4 shrink-0 shadow-inner">
                <Lock className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-black font-display tracking-tight leading-tight mb-2">
                Acceso de API REST Suspendido
              </h2>
              <p className="text-red-100 text-xs font-medium max-w-md leading-relaxed">
                La cuenta del inquilino <strong className="text-white font-bold">"{billingError.tenantName}"</strong> ha sido congelada por falta de pago del servicio.
              </p>
            </div>

            {/* Price Cards and Plan breakdown */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Plan Suscrito</span>
                  <div className="text-base font-extrabold text-slate-800 flex items-center space-x-1.5 mt-0.5">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                    <span>{billingError.plan}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Importe de Licencia</span>
                  <div className="text-base font-extrabold text-indigo-600 mt-0.5 font-mono">
                    ${billingError.monthlyPrice.toLocaleString()} ARS <span className="text-xs text-slate-400 font-sans font-medium">/mes</span>
                  </div>
                </div>
              </div>

              {/* Blocking notice */}
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-left">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-red-800">Corte de servicio por mora</h4>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Las credenciales del comercio están temporalmente deshabilitadas. El servidor API ha denegado la lectura y escritura para proteger la integridad de los datos. Pague su mensualidad ahora para reactivar su instancia de inmediato.
                  </p>
                </div>
              </div>

              {/* Action Buttons to pay */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutGateway("mercado_pago");
                    setShowCheckout(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2"
                >
                  <Coins className="h-4 w-4" />
                  <span>Pagar con Mercado Pago (mensual)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutGateway("stripe");
                    setShowCheckout(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pagar con Stripe</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                <span>¿Deseas probar la demo? Puedes activar el comercio con el switch superior</span>
              </div>
            </div>
          </div>

          {/* Interactive Checkout Modal (Mercado Pago / Stripe Simulation) */}
          {showCheckout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className={`p-6 text-white ${checkoutGateway === "mercado_pago" ? "bg-sky-600" : "bg-indigo-600"} flex justify-between items-center`}>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="text-sm font-black font-display uppercase tracking-wider">
                      {checkoutGateway === "mercado_pago" ? "Pasarela Mercado Pago" : "Pasarela Stripe"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="text-white/80 hover:text-white font-bold text-xs bg-black/15 px-2.5 py-1 rounded-lg"
                  >
                    Cerrar
                  </button>
                </div>

                {paymentSuccess ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">¡Pago Aprobado con Éxito!</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Se ha recibido el cobro recurrente de la mensualidad. La pasarela envió el Webhook de activación y tu comercio se ha reactivado con éxito.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProcessSubscription} className="p-6 space-y-4 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Total Suscripción Mensual:</span>
                      <span className="font-mono text-indigo-600 font-extrabold">
                        ${billingError.monthlyPrice.toLocaleString()} ARS
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nombre del Titular</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="JUAN PEREZ"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número de Tarjeta</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          maxLength={19}
                          placeholder="4517 8492 1092 3849"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vencimiento</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={5}
                            placeholder="12/29"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CVV / Código</label>
                          <input
                            type="password"
                            required
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value)}
                            maxLength={4}
                            placeholder="***"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`w-full py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-lg ${
                        checkoutGateway === "mercado_pago" 
                          ? "bg-sky-600 hover:bg-sky-700 shadow-sky-600/15" 
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/15"
                      }`}
                    >
                      {paymentLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Procesando pago...</span>
                        </>
                      ) : (
                        <span>Autorizar Pago Recurrente (Activar)</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        renderView()
      )}
    </Layout>
  );
}
