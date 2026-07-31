import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  DollarSign, 
  AlertCircle, 
  Check, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  CreditCard,
  Layers,
  Clock,
  Sparkles,
  Trash2,
  FileText,
  IdCard
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer, UnpaidItem } from "../types";

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: { name: string; dni?: string; email?: string; phone?: string }) => Promise<void>;
  onPayDebt: (id: string, amount: number) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export default function Customers({ customers, onAddCustomer, onPayDebt, onDeleteCustomer }: CustomersProps) {
  // Local UI State
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "deudores" | "sin_deuda">("todos");
  
  // Deletion state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  
  // Create customer form state
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [custError, setCustError] = useState("");
  const [loading, setLoading] = useState(false);

  // Selected customer for debt details or payment
  const [expandedCustId, setExpandedCustId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payError, setPayError] = useState<string>("");
  const [payLoading, setPayLoading] = useState<boolean>(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string>("");

  // General Customer Balance report
  const exportGeneralSaldosToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Top Header Banner - Professional Slate-900 Dark Theme
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 210, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("J&Z Indumentaria", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225); // Slate-300
      doc.text("Sistema Integral de Ventas, Clientes y Cta Corriente", 15, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Fecha Emisión: ${new Date().toLocaleString("es-AR")}`, 135, 18);
      doc.text(`Clientes Totales: ${customers.length}`, 135, 24);
      doc.text("Reporte: Cartera y Saldos Globales", 135, 30);

      // Report Header Section
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("REPORTE GENERAL DE SALDOS Y CUENTAS CORRIENTES", 15, 52);

      // Filter settings info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        `Filtro aplicado: ${activeTab === "todos" ? "Todos los clientes" : activeTab === "deudores" ? "Solo clientes deudores" : "Clientes al día"}` +
        (search ? ` - Búsqueda: "${search}"` : ""),
        15,
        58
      );

      // Stats Summary Block
      const totalDebtors = customers.filter(c => c.debt > 0).length;
      const totalDebtAmount = customers.reduce((acc, c) => acc + c.debt, 0);
      const totalBoughtAmount = customers.reduce((acc, c) => acc + c.totalBought, 0);

      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(15, 63, 180, 22, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      doc.text("Clientes con Deuda:", 20, 71);
      doc.setFont("helvetica", "normal");
      doc.text(`${totalDebtors} de ${customers.length}`, 53, 71);

      doc.setFont("helvetica", "bold");
      doc.text("Deuda Global Acumulada:", 20, 78);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38); // Red-600
      doc.text(`$${totalDebtAmount.toLocaleString("es-AR")}`, 62, 78);

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.text("Compras Totales Históricas:", 105, 71);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`$${totalBoughtAmount.toLocaleString("es-AR")}`, 152, 71);

      // Table Setup - 6 Columns properly proportioned to 180mm printable width
      const tableHeaders = [["Cliente", "DNI", "Teléfono / Email", "Fecha Reg.", "Total Compras", "Saldo Adeudado"]];
      const tableRows = filteredCustomers.map(c => {
        const phoneAndEmail = `${c.phone !== "-" ? c.phone : "S/T"}\n${c.email || "S/E"}`;
        const registeredDate = c.registeredAt ? new Date(c.registeredAt).toLocaleDateString("es-AR") : "S/F";
        return [
          c.name,
          c.dni || "-",
          phoneAndEmail,
          registeredDate,
          `$${c.totalBought.toLocaleString("es-AR")}`,
          `$${c.debt.toLocaleString("es-AR")}`
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 91,
        margin: { left: 15, right: 15 },
        theme: "striped",
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800 professional header
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 8,
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 42, fontStyle: "bold" },
          1: { cellWidth: 24 },
          2: { cellWidth: 38 },
          3: { cellWidth: 24, halign: "center" },
          4: { cellWidth: 26, halign: "right" },
          5: { cellWidth: 26, halign: "right", fontStyle: "bold" }
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 5) {
            const val = String(data.cell.raw || "");
            if (val !== "$0" && !val.startsWith("$0,")) {
              data.cell.styles.textColor = [220, 38, 38]; // Highlight active debts in RED
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [22, 163, 74]; // Green for $0 (Al día)
              data.cell.styles.fontStyle = "normal";
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text(
            `J&Z Indumentaria - Reporte de Cartera y Saldos - Página ${data.pageNumber} de ${pageCount}`,
            15,
            287
          );
        }
      });

      doc.save(`JZ_Indumentaria_Saldos_Clientes_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating general balances PDF:", error);
    }
  };

  // Individual Customer Statement PDF
  const exportCustomerStatementToPDF = (customer: Customer) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      // Top Header Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, 210, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("J&Z Indumentaria", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225);
      doc.text("Resumen de Cuenta Corriente y Deuda Activa", 15, 25);
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Fecha Emisión: ${new Date().toLocaleString("es-AR")}`, 135, 18);
      doc.text("Reporte: Estado de Cuenta Cliente", 135, 24);

      // Report Header Section
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("ESTADO DE CUENTA INDIVIDUAL", 15, 52);

      // Customer Personal Info Block
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 58, 180, 26, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      doc.text("Cliente:", 20, 65);
      doc.setFont("helvetica", "normal");
      doc.text(`${customer.name}${customer.dni ? ` (DNI: ${customer.dni})` : ''}`, 35, 65);

      doc.setFont("helvetica", "bold");
      doc.text("Teléfono:", 20, 72);
      doc.setFont("helvetica", "normal");
      doc.text(customer.phone !== "-" ? customer.phone : "No especificado", 37, 72);

      doc.setFont("helvetica", "bold");
      doc.text("Email:", 20, 79);
      doc.setFont("helvetica", "normal");
      doc.text(customer.email || "No especificado", 32, 79);

      // Total balance boxes in the block
      doc.setFont("helvetica", "bold");
      doc.text("Historial de Compras:", 110, 65);
      doc.setFont("helvetica", "normal");
      doc.text(`$${customer.totalBought.toLocaleString("es-AR")}`, 148, 65);

      doc.setFont("helvetica", "bold");
      doc.text("SALDO DEUDOR ACTUAL:", 110, 74);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38); // Red-600
      doc.setFontSize(11);
      doc.text(`$${customer.debt.toLocaleString("es-AR")}`, 155, 74);

      // Reset text style
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);

      // Table Setup - 5 columns totaling 180mm width
      const tableHeaders = [["Fecha Compra", "Artículo Comprado", "Cantidad", "Precio Unitario", "Saldo Pendiente"]];
      const tableRows = customer.debts.map(debt => {
        const formattedDate = new Date(debt.date).toLocaleDateString("es-AR");
        return [
          formattedDate,
          debt.productName,
          debt.quantity.toString(),
          `$${debt.price.toLocaleString("es-AR")}`,
          `$${debt.pendingAmount.toLocaleString("es-AR")}`
        ];
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 90,
        margin: { left: 15, right: 15 },
        theme: "striped",
        headStyles: {
          fillColor: [185, 28, 28], // Red-700 for debt statement
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold"
        },
        bodyStyles: {
          fontSize: 8,
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
          1: { cellWidth: 70, fontStyle: "bold" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right", fontStyle: "bold", textColor: [185, 28, 28] }
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate-400
          doc.text(
            `J&Z Indumentaria - Resumen de Cuenta de ${customer.name} - Página ${data.pageNumber} de ${pageCount}`,
            15,
            287
          );
        }
      });

      // Terms/Instructions at bottom
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      if (finalY < 250) {
        doc.setDrawColor(226, 232, 240);
        doc.line(15, finalY + 10, 195, finalY + 10);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Información de Pago:", 15, finalY + 16);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text("- Los pagos realizados se acreditan automáticamente a las facturas y artículos pendientes más antiguos.", 15, finalY + 22);
        doc.text("- Para transferencias bancarias, por favor envíe el comprobante correspondiente para su correcta imputación.", 15, finalY + 27);
        doc.text("- Este documento es un resumen informativo oficial del estado de cuenta provisto por J&Z Indumentaria.", 15, finalY + 32);
      }

      doc.save(`JZ_Indumentaria_Cuenta_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating individual customer statement PDF:", error);
    }
  };
  // Filters
  const filteredCustomers = customers.filter((c) => {
    // Avoid displaying final consumer in the standard customer database to keep it clean (or display with special tag)
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          (c.dni && c.dni.includes(search)) ||
                          (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
                          (c.phone && c.phone.includes(search));
                          
    const matchesTab = activeTab === "todos" || 
                       (activeTab === "deudores" && c.debt > 0) || 
                       (activeTab === "sin_deuda" && c.debt === 0);

    return matchesSearch && matchesTab;
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setCustError("El nombre es un campo obligatorio.");
      return;
    }

    setLoading(true);
    setCustError("");

    try {
      await onAddCustomer({ name, dni, email, phone });
      setIsNewCustOpen(false);
      setName("");
      setDni("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      setCustError(err.message || "Error al registrar cliente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebtSubmit = async (customerId: string) => {
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError("Monto inválido. Ingrese un número mayor a cero.");
      return;
    }

    const currentCust = customers.find(c => c.id === customerId);
    if (currentCust && amount > currentCust.debt) {
      setPayError(`El monto ingresado ($${amount}) supera la deuda total ($${currentCust.debt}).`);
      return;
    }

    setPayLoading(true);
    setPayError("");
    setPaySuccessMsg("");

    try {
      await onPayDebt(customerId, amount);
      setPaySuccessMsg(`¡Pago de $${amount.toLocaleString()} registrado con éxito! La deuda fue reducida.`);
      setPayAmount("");
      // Clear success message after some seconds
      setTimeout(() => setPaySuccessMsg(""), 5000);
    } catch (err: any) {
      setPayError(err.message || "Error al registrar el pago.");
    } finally {
      setPayLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCustId(expandedCustId === id ? null : id);
    setPayAmount("");
    setPayError("");
    setPaySuccessMsg("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">Cartera de Clientes</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de clientes, historial de compras, pagos a cuenta corriente y listado detallado de productos adeudados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={exportGeneralSaldosToPDF}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-sm"
          >
            <FileText className="h-4.5 w-4.5 text-slate-500" />
            <span>Reporte General (PDF)</span>
          </button>
          <button
            onClick={() => setIsNewCustOpen(!isNewCustOpen)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      </div>

      {/* New Customer Form Panel (Collapsible) */}
      {isNewCustOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 max-w-xl">
          <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Registrar Nuevo Cliente
          </h3>
          {custError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs mb-4 font-semibold">
              {custError}
            </div>
          )}
          <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre y Apellido *</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">DNI / CUIT</label>
              <input
                type="text"
                placeholder="Ej. 38123456"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Teléfono</label>
              <input
                type="text"
                placeholder="Ej. 11-2345-6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                placeholder="Ej. juan@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCustOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/15"
              >
                {loading ? "Registrando..." : "Confirmar Alta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Tab filters */}
        <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/40 w-full lg:w-auto">
          <button
            onClick={() => setActiveTab("todos")}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 w-full lg:w-auto justify-center ${
              activeTab === "todos"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
              {customers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("deudores")}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 w-full lg:w-auto justify-center ${
              activeTab === "deudores"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="h-2 w-2 bg-red-500 rounded-full"></span>
            <span>Cuentas con Deuda</span>
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
              {customers.filter(c => c.debt > 0).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("sin_deuda")}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 w-full lg:w-auto justify-center ${
              activeTab === "sin_deuda"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
            <span>Al Día / Sin Deuda</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
              {customers.filter(c => c.debt === 0).length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, email o celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Accordion List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No se encontraron clientes que coincidan con la búsqueda.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = expandedCustId === cust.id;
              const hasDebt = cust.debt > 0;
              
              return (
                <div key={cust.id} className={`transition-all ${isExpanded ? "bg-slate-50/40" : "hover:bg-slate-50/20"}`}>
                  {/* Row Header (Main Customer info) */}
                  <div 
                    onClick={() => toggleExpand(cust.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl border ${
                        hasDebt 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-semibold text-slate-900">{cust.name}</h3>
                          {cust.id === "cust_anonymous" && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-full font-bold">
                              Predeterminado
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                          {cust.dni && (
                            <span className="flex items-center space-x-1 font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              <IdCard className="h-3 w-3 text-slate-400" />
                              <span>DNI: {cust.dni}</span>
                            </span>
                          )}
                          {cust.email && (
                            <span className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-slate-300" />
                              <span>{cust.email}</span>
                            </span>
                          )}
                          {cust.phone && cust.phone !== "-" && (
                            <span className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-slate-300" />
                              <span>{cust.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-x-6">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Historial Compras</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">${cust.totalBought.toLocaleString()}</p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Estado Cuenta</p>
                        {hasDebt ? (
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-bold text-red-600 font-mono">
                              Debe ${cust.debt.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                            Al día
                          </span>
                        )}
                      </div>

                      {cust.id !== "cust_anonymous" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerToDelete(cust);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-all"
                          title="Eliminar Cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      <button className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-lg">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Customer Details: Debt items listing & pay register */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 border-t border-slate-100 bg-slate-50/70 grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Products they owe (Productos que deben) */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex justify-between items-center gap-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Productos adeudados en cuenta corriente</span>
                          </h4>
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportCustomerStatementToPDF(cust);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-bold text-slate-600 hover:text-indigo-600 rounded-lg transition-all shadow-sm"
                              title="Descargar Estado de Cuenta del Cliente en PDF"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <span>Descargar Resumen (PDF)</span>
                            </button>
                          )}
                        </div>
                        
                        {!hasDebt || cust.debts.length === 0 ? (
                          <div className="bg-white p-6 rounded-xl border border-slate-200/50 text-center text-slate-400 text-xs">
                            ✓ Este cliente no tiene productos pendientes de pago.
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-slate-200/50 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-200/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Fecha Compra</th>
                                    <th className="py-2.5 px-4">Artículo</th>
                                    <th className="py-2.5 px-4 text-center">Cant.</th>
                                    <th className="py-2.5 px-4 text-right">Precio Unit.</th>
                                    <th className="py-2.5 px-4 text-right">Saldo Pendiente</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {cust.debts.map((debt, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 font-medium">
                                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px]">
                                        {new Date(debt.date).toLocaleDateString("es-AR")}
                                      </td>
                                      <td className="py-2.5 px-4 text-slate-900 font-semibold">
                                        {debt.productName}
                                      </td>
                                      <td className="py-2.5 px-4 text-center text-slate-600">
                                        {debt.quantity}
                                      </td>
                                      <td className="py-2.5 px-4 text-right text-slate-500">
                                        ${debt.price.toLocaleString()}
                                      </td>
                                      <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                                        ${debt.pendingAmount.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="bg-red-50/50 p-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-red-800">
                              <span>DEUDA ACUMULADA TOTAL:</span>
                              <span className="font-mono text-sm font-extrabold">${cust.debt.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pay off Debt Portal */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200/50 shadow-sm flex flex-col justify-between h-fit space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span>Registrar Pago / Entrega</span>
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Ingresa el dinero entregado por el cliente. Se acreditará a los artículos más antiguos primero.
                          </p>
                        </div>

                        {paySuccessMsg && (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-start space-x-1">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{paySuccessMsg}</span>
                          </div>
                        )}

                        {payError && (
                          <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-[11px] font-semibold flex items-start space-x-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
                            <span>{payError}</span>
                          </div>
                        )}

                        {hasDebt ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monto Entregado ($)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  placeholder="Ej. 10000"
                                  value={payAmount}
                                  onChange={(e) => setPayAmount(e.target.value)}
                                  className="w-full text-xs font-bold pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePayDebtSubmit(cust.id)}
                              disabled={payLoading || !payAmount}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs p-3 rounded-xl transition-all shadow-md shadow-indigo-600/10"
                            >
                              {payLoading ? "Guardando..." : "Cargar Pago"}
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <span className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full mb-2">
                              <Check className="h-4 w-4" />
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">CLIENTE AL DÍA</span>
                            <p className="text-[10px] text-slate-400 max-w-[150px] mt-0.5">No tiene saldos pendientes por abonar.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">¿Eliminar Cliente?</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Está seguro de que desea eliminar a <strong className="text-slate-900">{customerToDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>

            {customerToDelete.debt > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs mb-4 font-medium flex items-start space-x-2">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Atención:</strong> Este cliente posee una deuda activa de <strong>${customerToDelete.debt.toLocaleString()}</strong>.
                </span>
              </div>
            )}

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs mb-4 font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setCustomerToDelete(null);
                  setDeleteError("");
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError("");
                  try {
                    await onDeleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  } catch (err: any) {
                    setDeleteError(err.message || "Fallo al eliminar cliente");
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-red-600/15 flex items-center space-x-1.5"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
