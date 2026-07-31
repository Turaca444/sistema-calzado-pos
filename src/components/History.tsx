import React, { useState } from "react";
import { 
  Search, 
  History as HistoryIcon, 
  Calendar, 
  User, 
  Tag, 
  ArrowUpRight,
  Filter,
  DollarSign,
  ChevronDown,
  X,
  CreditCard,
  FileText,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Sale, Customer } from "../types";
import { exportFacturaB } from "../utils/facturaPDF";

interface HistoryProps {
  sales: Sale[];
  customers?: Customer[];
  onDeleteSale?: (id: string) => Promise<void>;
}

export default function History({ sales, customers = [], onDeleteSale }: HistoryProps) {
  const [search, setSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [vendedorFilter, setVendedorFilter] = useState("Todos");
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const confirmDeleteSale = async () => {
    if (!deletingSale || !onDeleteSale) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDeleteSale(deletingSale.id);
      setDeletingSale(null);
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar transacción");
    } finally {
      setIsDeleting(false);
    }
  };

  // Extraer lista única de vendedores
  const uniqueSellers = React.useMemo(() => {
    const sellers = new Set<string>();
    sales.forEach(s => {
      if (s.userName) {
        sellers.add(s.userName);
      }
    });
    return Array.from(sellers);
  }, [sales]);

  // Filtering logic
  const filteredSales = sales.filter((s) => {
    // Search match
    const searchLower = search.toLowerCase();
    const matchesCustomer = s.customerName.toLowerCase().includes(searchLower);
    
    // Check if any product matches the search query
    const matchesProducts = s.items.some(item => 
      item.productName.toLowerCase().includes(searchLower)
    );

    const matchesSearch = matchesCustomer || matchesProducts || s.id.toLowerCase().includes(searchLower) || (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(searchLower));

    // Payment method filter
    const matchesPayment = paymentMethodFilter === "Todos" || s.paymentMethod === paymentMethodFilter;

    // Status filter
    const matchesStatus = statusFilter === "Todos" || s.status === statusFilter;

    // Vendedor filter
    const matchesVendedor = vendedorFilter === "Todos" || s.userName === vendedorFilter;

    return matchesSearch && matchesPayment && matchesStatus && matchesVendedor;
  });

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cuenta_corriente":
        return "bg-red-50 text-red-700 border-red-200/50";
      case "transferencia":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cuenta_corriente":
        return "Cta Corriente";
      case "transferencia":
        return "Transferencia";
      default:
        return "Efectivo / Contado";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagado":
        return "bg-emerald-100 text-emerald-800";
      case "parcialmente_pagado":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pagado":
        return "Pagado";
      case "parcialmente_pagado":
        return "Pago Parcial";
      default:
        return "Debe";
    }
  };

  // PDF Generation Function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Cover top stripe: elegant indigo header block
      doc.setFillColor(79, 70, 229); // Brand color: Indigo-600
      doc.rect(0, 0, 210, 42, "F");

      // App Brand Title & Subtitle inside block
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("J&Z Indumentaria", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(199, 210, 254); // Soft indigo-200
      doc.text("Sistema Integral de Ventas, Clientes y Cta Corriente", 15, 25);
      
      // Top right info inside block
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Fecha Emisión: ${new Date().toLocaleString("es-AR")}`, 140, 18);
      doc.text(`Registros: ${filteredSales.length} de ${sales.length}`, 140, 24);
      doc.text("Reporte: Historial Comercial", 140, 30);

      // Report Header Section
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("REPORTE DE HISTORIAL DE VENTAS", 15, 54);

      // Filter settings info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        `Filtros aplicados: Medio [${paymentMethodFilter}] - Estado [${statusFilter}]` + 
        (search ? ` - Búsqueda: "${search}"` : ""),
        15,
        60
      );

      // Summary Stats Block
      const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
      const totalPending = filteredSales
        .filter(s => s.paymentMethod === "cuenta_corriente" && s.status !== "pagado")
        .reduce((acc, s) => acc + s.debtAmount, 0);
      const totalCashAndTrans = filteredSales
        .filter(s => s.paymentMethod !== "cuenta_corriente")
        .reduce((acc, s) => acc + s.total, 0);

      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(15, 66, 180, 22, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600

      // Column 1 stats
      doc.text("Operaciones Totales:", 20, 74);
      doc.setFont("helvetica", "normal");
      doc.text(`${filteredSales.length}`, 55, 74);

      doc.setFont("helvetica", "bold");
      doc.text("Facturación Total:", 20, 81);
      doc.setFont("helvetica", "normal");
      doc.text(`$${totalRevenue.toLocaleString("es-AR")}`, 50, 81);

      // Column 2 stats
      doc.setFont("helvetica", "bold");
      doc.text("Pendiente Cta Cte:", 95, 74);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 38, 38); // Red-600
      doc.text(`$${totalPending.toLocaleString("es-AR")}`, 125, 74);

      doc.setTextColor(71, 85, 105); // Reset Slate-600
      doc.setFont("helvetica", "bold");
      doc.text("Cobrado Efectivo/Trans:", 95, 81);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(5, 150, 105); // Emerald-600
      doc.text(`$${totalCashAndTrans.toLocaleString("es-AR")}`, 133, 81);

      // Table Setup
      const tableHeaders = [["Nro Venta", "Fecha", "Cliente", "Artículos Comprados", "Medio Cobro", "Estado", "Total"]];
      const tableRows = filteredSales.map(sale => {
        const formattedDate = new Date(sale.date).toLocaleDateString("es-AR") + " " + new Date(sale.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const itemsStr = sale.items.map(it => `${it.productName} (x${it.quantity})`).join("\n");
        
        let methodStr = "Efectivo/Contado";
        if (sale.paymentMethod === "cuenta_corriente") methodStr = "Cta Corriente";
        else if (sale.paymentMethod === "transferencia") methodStr = "Transferencia";
        
        let statusStr = "Debe";
        if (sale.status === "pagado") statusStr = "Pagado";
        else if (sale.status === "parcialmente_pagado") statusStr = "Pago Parcial";
        
        return [
          sale.invoiceNumber || `#${sale.id}`,
          formattedDate,
          sale.userName ? `${sale.customerName}\n(Vend: ${sale.userName})` : sale.customerName,
          itemsStr,
          methodStr,
          statusStr,
          `$${sale.total.toLocaleString("es-AR")}`
        ];
      });

      // Draw AutoTable
      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 96,
        margin: { left: 15, right: 15 },
        theme: "striped",
        headStyles: {
          fillColor: [79, 70, 229], // Indigo-600
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 7.5,
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 16, fontStyle: "bold" },
          1: { cellWidth: 26 },
          2: { cellWidth: 32, fontStyle: "bold" },
          3: { cellWidth: 54 },
          4: { cellWidth: 22 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15, halign: "right", fontStyle: "bold" }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text(
            `J&Z Indumentaria - Reporte de Historial de Ventas - Página ${data.pageNumber} de ${pageCount}`,
            15,
            287
          );
        }
      });

      // Save PDF
      doc.save(`JZ_Indumentaria_Historial_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating sales history PDF:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">Historial de Compras</h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro cronológico detallado de todas las ventas, métodos de liquidación, cobros y entregas de mercadería.
          </p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 w-fit self-end sm:self-auto"
        >
          <FileText className="h-4.5 w-4.5" />
          <span>Exportar Historial (PDF)</span>
        </button>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operaciones Totales</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{sales.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturación Total</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">
            ${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">En Cuenta Corriente</p>
          <p className="text-2xl font-bold font-display text-red-600 mt-1">
            ${sales.filter(s => s.paymentMethod === "cuenta_corriente" && s.status !== "pagado").reduce((acc, s) => acc + s.debtAmount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas de Contado / Trans.</p>
          <p className="text-2xl font-bold font-display text-emerald-600 mt-1">
            ${sales.filter(s => s.paymentMethod !== "cuenta_corriente").reduce((acc, s) => acc + s.total, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, artículo o ID de venta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Method Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Medio:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Todos">Todos</option>
              <option value="contado">Efectivo / Contado</option>
              <option value="transferencia">Transferencia</option>
              <option value="cuenta_corriente">Cuenta Corriente</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Todos">Todos</option>
              <option value="pagado">Liquidado / Pagado</option>
              <option value="pendiente">Pendiente (Debe)</option>
              <option value="parcialmente_pagado">Pago Parcial</option>
            </select>
          </div>

          {/* Vendedor Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Vendedor:</span>
            <select
              value={vendedorFilter}
              onChange={(e) => setVendedorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Todos">Todos</option>
              {uniqueSellers.map(seller => (
                <option key={seller} value={seller}>{seller}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History timeline table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">ID / Fecha de Compra</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6">Artículos Comprados</th>
                <th className="py-4 px-6 text-center">Forma Cobro</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-right">Total Factura</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron transacciones en el historial.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-indigo-700 font-mono text-xs bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md w-fit">
                          {sale.invoiceNumber || `#${sale.id}`}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          <span>
                            {new Date(sale.date).toLocaleString("es-AR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{sale.customerName}</span>
                        {sale.userName && (
                          <span className="text-[9px] text-indigo-600 mt-1 font-extrabold flex items-center bg-indigo-50/60 border border-indigo-100/30 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                            👤 {sale.userName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs md:max-w-md">
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 border border-slate-100 p-1.5 rounded-lg">
                            <span className="text-slate-600 font-semibold">{item.productName} <strong className="text-indigo-600">x{item.quantity}</strong></span>
                            <span className="text-slate-500 font-bold">${item.price.toLocaleString()} c/u</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold border ${getPaymentMethodBadge(sale.paymentMethod)}`}>
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${getStatusBadge(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm font-extrabold text-slate-900 font-mono">${sale.total.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const customerObj = customers.find(c => c.id === sale.customerId);
                            exportFacturaB(sale, customerObj);
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-500 hover:text-emerald-600 transition-all shadow-sm"
                          title="Descargar Factura Tipo B (PDF)"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {onDeleteSale && (
                          <button
                            type="button"
                            onClick={() => setDeletingSale(sale)}
                            className="inline-flex items-center justify-center p-2 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-600 transition-all shadow-sm"
                            title="Eliminar de historial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom elegant delete transaction modal */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">¿Eliminar transacción?</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Está seguro de que desea eliminar la transacción <strong className="text-slate-900 font-mono">#{deletingSale.id}</strong> realizada por <strong className="text-slate-900">{deletingSale.customerName}</strong>? Esta acción no se puede deshacer y retirará este registro del historial permanentemente.
            </p>

            {deletingSale.paymentMethod === "cuenta_corriente" && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs mb-5 font-medium flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Como la venta fue registrada a <strong>Cuenta Corriente</strong>, al eliminarla también se deducirá del saldo de deuda pendiente del cliente y se cancelarán sus cargos correspondientes.
                </span>
              </div>
            )}

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingSale(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteSale}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-red-600/15 flex items-center space-x-1.5"
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
