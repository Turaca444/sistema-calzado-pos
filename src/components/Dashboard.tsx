import React from "react";
import { 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight,
  ShoppingBag,
  CreditCard,
  UserCheck
} from "lucide-react";
import { Product, Customer, Sale, User } from "../types";

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  users?: User[];
  setView: (view: string) => void;
}

export default function Dashboard({ products, customers, sales, users = [], setView }: DashboardProps) {
  // Calculations
  const totalSalesRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  
  // Ventas agrupadas por vendedor
  const sellerMetrics = React.useMemo(() => {
    const metrics: { [key: string]: { name: string; totalSales: number; count: number; role: string } } = {};
    
    // Inicializar con todos los usuarios conocidos del local actual
    users.forEach(u => {
      metrics[u.id] = {
        name: u.name,
        totalSales: 0,
        count: 0,
        role: u.role
      };
    });

    // Acumular desde el historial de ventas
    sales.forEach(sale => {
      // Intentamos machear por ID o por el nombre guardado en la venta
      const uId = sale.userId || `unknown_${sale.userName}`;
      const uName = sale.userName || "Vendedor General";
      
      if (!metrics[uId]) {
        metrics[uId] = {
          name: uName,
          totalSales: 0,
          count: 0,
          role: "vendedor"
        };
      }
      metrics[uId].totalSales += sale.total;
      metrics[uId].count += 1;
    });

    // Retornar ordenados por mayor facturación
    return Object.values(metrics).sort((a, b) => b.totalSales - a.totalSales);
  }, [sales, users]);
  
  // Total cost of items sold (for profit estimation)
  // Let's match item costs dynamically
  const estimatedProfit = sales.reduce((acc, sale) => {
    const saleCost = sale.items.reduce((itemCostAcc, item) => {
      const prod = products.find(p => p.id === item.productId);
      const costPerUnit = prod ? prod.cost : item.price * 0.5; // fallback 50% cost
      return itemCostAcc + (costPerUnit * item.quantity);
    }, 0);
    return acc + (sale.total - saleCost);
  }, 0);

  const totalStockItems = products.reduce((acc, prod) => acc + prod.stock, 0);
  const totalStockValue = products.reduce((acc, prod) => acc + (prod.price * prod.stock), 0);
  
  const totalDebtsAmount = customers.reduce((acc, cust) => acc + cust.debt, 0);
  const debtorsCount = customers.filter(cust => cust.debt > 0).length;

  const lowStockProducts = products.filter(prod => prod.stock <= prod.minStock);

  // Statistics for recent sales
  const recentSales = sales.slice(0, 5);

  // Quick summary stats
  const stats = [
    {
      id: "ventas",
      label: "Total Ventas",
      value: `$${totalSalesRevenue.toLocaleString()}`,
      description: `${sales.length} transacciones registradas`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-100",
    },
    {
      id: "ganancia",
      label: "Ganancia Estimada",
      value: `$${estimatedProfit.toLocaleString()}`,
      description: "Margen de utilidad calculado",
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-100",
    },
    {
      id: "stock",
      label: "Valor de Inventario",
      value: `$${totalStockValue.toLocaleString()}`,
      description: `${totalStockItems} unidades en stock`,
      icon: Package,
      color: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-100",
    },
    {
      id: "deuda",
      label: "Deudas de Clientes",
      value: `$${totalDebtsAmount.toLocaleString()}`,
      description: `${debtorsCount} clientes con cuenta corriente`,
      icon: Users,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">Resumen General</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión en tiempo real de artículos, clientes deudores y facturación.
          </p>
        </div>
        <button
          onClick={() => setView("sales-new")}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Registrar Nueva Venta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.id} 
              className={`p-6 rounded-2xl border bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                <span className={`p-2.5 rounded-xl border ${stat.bgColor} ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold font-display tracking-tight text-slate-900">{stat.value}</span>
                <p className="text-xs text-slate-400 mt-1 font-medium">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Purchases List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Ventas Recientes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimas transacciones completadas</p>
            </div>
            <button
              onClick={() => setView("history")}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-xs flex items-center space-x-1"
            >
              <span>Ver todo el historial</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-x-auto">
            {recentSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No hay ventas registradas todavía. ¡Realiza una venta para comenzar!
              </div>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-150 min-w-[500px]">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2.5 rounded-xl ${
                      sale.paymentMethod === "cuenta_corriente"
                        ? "bg-red-50 text-red-600 border border-red-100"
                        : sale.paymentMethod === "transferencia"
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-slate-900">{sale.customerName}</h4>
                        {sale.userName && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold flex items-center">
                            👤 {sale.userName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {new Date(sale.date).toLocaleString("es-AR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })} • {sale.items.length} {sale.items.length === 1 ? "artículo" : "artículos"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-500">Pago</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 uppercase tracking-wide ${
                        sale.paymentMethod === "cuenta_corriente"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : sale.paymentMethod === "transferencia"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        {sale.paymentMethod === "cuenta_corriente" ? "Cta. Corriente" : sale.paymentMethod}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">${sale.total.toLocaleString()}</p>
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5 ${
                        sale.status === "pagado"
                          ? "bg-emerald-100 text-emerald-800"
                          : sale.status === "parcialmente_pagado"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {sale.status === "pagado" ? "Pagado" : sale.status === "parcialmente_pagado" ? "Parcial" : "Debe"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts and Category summary */}
        <div className="space-y-6">
          {/* Alertas de Stock Bajo */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Alertas de Stock</h3>
                <p className="text-xs text-slate-400 mt-0.5">Artículos próximos a agotarse</p>
              </div>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  ✓ Todo el inventario tiene niveles óptimos de stock.
                </div>
              ) : (
                lowStockProducts.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors duration-150">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{prod.category} • Mínimo: {prod.minStock}</p>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        prod.stock === 0 
                          ? "bg-red-100 text-red-800" 
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {prod.stock === 0 ? "Sin Stock" : `${prod.stock} u.`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {lowStockProducts.length > 0 && (
              <button 
                onClick={() => setView("products")}
                className="mt-4 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-2 border border-dashed border-indigo-100 hover:border-indigo-300 rounded-xl transition-all"
              >
                Gestionar artículos e inventario
              </button>
            )}
          </div>

          {/* Cuentas Corrientes Activas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Top Deudores</h3>
                <p className="text-xs text-slate-400 mt-0.5">Saldos pendientes en cuenta corriente</p>
              </div>
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                <Users className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-3">
              {customers.filter(c => c.debt > 0).slice(0, 3).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  ✓ No hay cuentas corrientes pendientes.
                </div>
              ) : (
                customers
                  .filter(c => c.debt > 0)
                  .sort((a, b) => b.debt - a.debt)
                  .slice(0, 3)
                  .map((cust) => (
                    <div key={cust.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{cust.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{cust.debts.length} prendas/artículos fia-dos</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-red-600 font-mono">${cust.debt.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <button 
              onClick={() => setView("customers")}
              className="w-full mt-4 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 py-2 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all"
            >
              Ver todos los clientes
            </button>
          </div>

          {/* Ventas por Vendedor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Ventas por Vendedor</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rendimiento y ventas de cada operador</p>
              </div>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-4">
              {sellerMetrics.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No hay registro de ventas por vendedor.
                </div>
              ) : (
                sellerMetrics.map((sm, idx) => {
                  const percentage = totalSalesRevenue > 0 ? (sm.totalSales / totalSalesRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{sm.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {sm.count} {sm.count === 1 ? "venta" : "ventas"} • {sm.role === "administrador" ? "Admin" : "Vendedor"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-950 font-mono">${sm.totalSales.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{percentage.toFixed(0)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
