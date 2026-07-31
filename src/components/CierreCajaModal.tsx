import React, { useState, useMemo } from "react";
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  X, 
  Printer, 
  MinusCircle, 
  PlusCircle, 
  Calculator, 
  ShieldCheck,
  Building2,
  Wallet,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Sale, Product, Customer, User, DailyClosing } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface CierreCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  users: User[];
  activeUser?: User | null;
  tenantName: string;
  tenantId: string;
  onSaveDailyClosing?: (closing: DailyClosing) => void;
}

export default function CierreCajaModal({
  isOpen,
  onClose,
  sales,
  products,
  customers,
  users,
  activeUser,
  tenantName,
  tenantId,
  onSaveDailyClosing
}: CierreCajaModalProps) {
  // Selected date defaults to today in YYYY-MM-DD
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  // Cash Register Balance Inputs
  const [initialCash, setInitialCash] = useState<string>("10000"); // Fondo inicial por defecto
  const [expenses, setExpenses] = useState<string>("0"); // Egresos / gastos de caja
  const [expenseNote, setExpenseNote] = useState<string>("");
  const [actualCashCounted, setActualCashCounted] = useState<string>(""); // Efectivo contado por el usuario
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Filter sales for selected date
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = s.date.slice(0, 10);
      return sDate === selectedDate;
    });
  }, [sales, selectedDate]);

  // Financial Breakdown
  const cashSales = useMemo(() => {
    return filteredSales
      .filter((s) => s.paymentMethod === "contado")
      .reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const debitCardSales = useMemo(() => {
    return filteredSales
      .filter((s) => s.paymentMethod === "tarjeta_debito")
      .reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const creditCardSales = useMemo(() => {
    return filteredSales
      .filter((s) => s.paymentMethod === "tarjeta_credito")
      .reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const transferSales = useMemo(() => {
    return filteredSales
      .filter((s) => s.paymentMethod === "transferencia")
      .reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const creditSales = useMemo(() => {
    return filteredSales
      .filter((s) => s.paymentMethod === "cuenta_corriente")
      .reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const totalSalesRevenue = cashSales + debitCardSales + creditCardSales + transferSales + creditSales;

  // Total items sold count
  const totalItemsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  }, [filteredSales]);

  // Breakdown by Seller
  const sellerBreakdown = useMemo(() => {
    const map: {
      [key: string]: {
        name: string;
        count: number;
        cash: number;
        debitCard: number;
        creditCard: number;
        transfer: number;
        credit: number;
        total: number;
      };
    } = {};

    filteredSales.forEach((s) => {
      const key = s.userId || s.userName || "Vendedor General";
      const name = s.userName || "Vendedor General";
      if (!map[key]) {
        map[key] = { name, count: 0, cash: 0, debitCard: 0, creditCard: 0, transfer: 0, credit: 0, total: 0 };
      }
      map[key].count += 1;
      map[key].total += s.total;
      if (s.paymentMethod === "contado") map[key].cash += s.total;
      else if (s.paymentMethod === "tarjeta_debito") map[key].debitCard += s.total;
      else if (s.paymentMethod === "tarjeta_credito") map[key].creditCard += s.total;
      else if (s.paymentMethod === "transferencia") map[key].transfer += s.total;
      else if (s.paymentMethod === "cuenta_corriente") map[key].credit += s.total;
    });

    return Object.values(map);
  }, [filteredSales]);

  if (!isOpen) return null;

  // Balance Calculations
  const numInitial = Number(initialCash) || 0;
  const numExpenses = Number(expenses) || 0;
  const numActualCounted = actualCashCounted === "" ? null : Number(actualCashCounted);

  // Expected Cash in Drawer = Initial + Cash Sales - Expenses
  const expectedCashInDrawer = numInitial + cashSales - numExpenses;

  // Difference = Actual Counted - Expected
  const cashDifference = numActualCounted !== null ? numActualCounted - expectedCashInDrawer : 0;

  // Generate PDF Balance & Arqueo Report
  const handleDownloadPDFReport = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const dateFormatted = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      const timeStr = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 36, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("INFORME DE BALANCE Y ARQUEO DE CAJA DIARIO", 14, 16);

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Comercio: ${tenantName.toUpperCase()} | Fecha de Arqueo: ${dateFormatted}`, 14, 24);
      doc.text(`Generado por: ${activeUser?.name || "Administrador"} - Emisión: ${timeStr} hs`, 14, 30);

      // Section 1: RESUMEN GENERAL DE CAJA Y ARQUEO
      let currentY = 44;

      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(14, currentY, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("1. AUDITORÍA Y BALANCE FÍSICO DE CAJA (ARQUEO DE DINERO)", 18, currentY + 5.5);

      currentY += 12;

      autoTable(doc, {
        startY: currentY,
        margin: { left: 14, right: 14 },
        head: [["Concepto de Movimiento", "Monto en Pesos ($)"]],
        body: [
          ["(+) Fondo de Caja Inicial (Apertura de Turno)", `$${numInitial.toLocaleString("es-AR")}`],
          ["(+) Ventas en Efectivo (Cobrado en Cajón)", `$${cashSales.toLocaleString("es-AR")}`],
          ["(-) Egresos / Retiros de Caja Chica", `$${numExpenses.toLocaleString("es-AR")} ${expenseNote ? `(${expenseNote})` : ""}`],
          ["(=) EFECTIVO TEÓRICO ESPERADO EN CAJA", `$${expectedCashInDrawer.toLocaleString("es-AR")}`],
          ["(x) EFECTIVO REAL CONTADO EN CAJÓN", numActualCounted !== null ? `$${numActualCounted.toLocaleString("es-AR")}` : "No ingresado"],
          [
            "(=) DIFERENCIA DE ARQUEO",
            numActualCounted === null
              ? "Pendiente de conteo"
              : cashDifference === 0
              ? "CUADRE EXACTO ($0,00)"
              : cashDifference > 0
              ? `SOBRANTE: +$${cashDifference.toLocaleString("es-AR")}`
              : `FALTANTE: -$${Math.abs(cashDifference).toLocaleString("es-AR")}`
          ]
        ],
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 120 },
          1: { halign: "right", fontStyle: "bold", cellWidth: 62 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Section 2: DESGLOSE COMPLETO DE VENTAS POR MEDIO DE PAGO
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("2. DESGLOSE TOTAL DE VENTAS Y MEDIOS DE PAGO DEL DÍA", 18, currentY + 5.5);

      currentY += 12;

      autoTable(doc, {
        startY: currentY,
        margin: { left: 14, right: 14 },
        head: [["Medio de Pago", "Cant. Operaciones", "Total Facturado ($)", "% del Total"]],
        body: [
          [
            "Efectivo (Ingresó a Cajón)",
            `${filteredSales.filter((s) => s.paymentMethod === "contado").length} ventas`,
            `$${cashSales.toLocaleString("es-AR")}`,
            totalSalesRevenue > 0 ? `${((cashSales / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"
          ],
          [
            "Tarjeta de Débito",
            `${filteredSales.filter((s) => s.paymentMethod === "tarjeta_debito").length} ventas`,
            `$${debitCardSales.toLocaleString("es-AR")}`,
            totalSalesRevenue > 0 ? `${((debitCardSales / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"
          ],
          [
            "Tarjeta de Crédito",
            `${filteredSales.filter((s) => s.paymentMethod === "tarjeta_credito").length} ventas`,
            `$${creditCardSales.toLocaleString("es-AR")}`,
            totalSalesRevenue > 0 ? `${((creditCardSales / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"
          ],
          [
            "Transferencia / MercadoPago / QR",
            `${filteredSales.filter((s) => s.paymentMethod === "transferencia").length} ventas`,
            `$${transferSales.toLocaleString("es-AR")}`,
            totalSalesRevenue > 0 ? `${((transferSales / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"
          ],
          [
            "Cuenta Corriente (Fiado a Clientes)",
            `${filteredSales.filter((s) => s.paymentMethod === "cuenta_corriente").length} ventas`,
            `$${creditSales.toLocaleString("es-AR")}`,
            totalSalesRevenue > 0 ? `${((creditSales / totalSalesRevenue) * 100).toFixed(1)}%` : "0%"
          ],
          [
            "TOTAL GENERAL DEL DÍA",
            `${filteredSales.length} operaciones`,
            `$${totalSalesRevenue.toLocaleString("es-AR")}`,
            "100%"
          ]
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { fontSize: 8.5 },
        columnStyles: {
          0: { fontStyle: "bold" },
          1: { halign: "center" },
          2: { halign: "right", fontStyle: "bold" },
          3: { halign: "center" }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Section 3: RENDIMIENTO POR VENDEDOR
      if (sellerBreakdown.length > 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, currentY, 182, 8, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("3. RENDIMIENTO Y RECAUDACIÓN POR VENDEDOR", 18, currentY + 5.5);

        currentY += 12;

        const sellerRows = sellerBreakdown.map((sb) => [
          sb.name,
          `${sb.count} vtas`,
          `$${sb.cash.toLocaleString("es-AR")}`,
          `$${(sb.debitCard + sb.creditCard).toLocaleString("es-AR")}`,
          `$${sb.transfer.toLocaleString("es-AR")}`,
          `$${sb.credit.toLocaleString("es-AR")}`,
          `$${sb.total.toLocaleString("es-AR")}`
        ]);

        autoTable(doc, {
          startY: currentY,
          margin: { left: 14, right: 14 },
          head: [["Vendedor", "Tickets", "Efectivo", "Tarjetas", "Transfer.", "Cta. Cte.", "Total Recaudado"]],
          body: sellerRows,
          theme: "grid",
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
          bodyStyles: { fontSize: 7.5 },
          columnStyles: {
            0: { fontStyle: "bold" },
            1: { halign: "center" },
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "right" },
            5: { halign: "right" },
            6: { halign: "right", fontStyle: "bold" }
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Section 4: FIRMAS Y OBSERVACIONES
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      if (closingNotes) {
        doc.text(`Observaciones: ${closingNotes}`, 14, currentY);
        currentY += 10;
      }

      // Signature lines
      const sigY = currentY + 15;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);

      doc.line(25, sigY, 85, sigY);
      doc.text("Firma Responsable de Caja", 32, sigY + 5);

      doc.line(125, sigY, 185, sigY);
      doc.text("Firma Conformidad Dueño / Admin", 128, sigY + 5);

      doc.save(`Balance_Caja_${tenantName.replace(/\s+/g, "_")}_${selectedDate}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error al generar el PDF de balance de caja");
    }
  };

  // Official Close Handler
  const handleOfficialClose = () => {
    const closingRecord: DailyClosing = {
      id: `close_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      tenantId,
      date: selectedDate,
      closedAt: new Date().toISOString(),
      closedByUserId: activeUser?.id,
      closedByUserName: activeUser?.name || "Administrador",
      initialCash: numInitial,
      cashSales,
      transferSales,
      debitCardSales,
      creditCardSales,
      creditSales,
      totalSales: totalSalesRevenue,
      expenses: numExpenses,
      expectedCash: expectedCashInDrawer,
      actualCash: numActualCounted !== null ? numActualCounted : expectedCashInDrawer,
      difference: cashDifference,
      notes: closingNotes || (expenseNote ? `Egresos: ${expenseNote}` : undefined)
    };

    if (onSaveDailyClosing) {
      onSaveDailyClosing(closingRecord);
    }
    setIsSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black font-display tracking-tight">
                  Balance & Arqueo de Caja Diario
                </h3>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                  Auditoría de Cierre
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Cierre de jornada, conteo de efectivo, control de desfasajes y desglose de cobranzas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-2xl transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Selector & Status Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300">Fecha del Balance:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setIsSaved(false);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Building2 className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-400">Local:</span>
              <span className="font-bold text-white">{tenantName}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Auditado por:</span>
              <span className="font-bold text-white">{activeUser?.name || "Administrador"}</span>
            </div>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">

          {/* Top Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Sales Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[9.5px] font-black uppercase tracking-wider">Total Facturado</span>
                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                ${totalSalesRevenue.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium">
                {filteredSales.length} vtas ({totalItemsSold} arts)
              </div>
            </div>

            {/* Cash Sales Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-emerald-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[9.5px] font-black uppercase tracking-wider">Efectivo</span>
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-700 font-mono">
                ${cashSales.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-emerald-600 font-medium">
                {filteredSales.filter((s) => s.paymentMethod === "contado").length} vtas contado
              </div>
            </div>

            {/* Debit Card Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-cyan-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-cyan-700">
                <span className="text-[9.5px] font-black uppercase tracking-wider">T. Débito</span>
                <CreditCard className="h-3.5 w-3.5 text-cyan-600" />
              </div>
              <div className="text-lg font-black text-cyan-700 font-mono">
                ${debitCardSales.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-cyan-600 font-medium">
                {filteredSales.filter((s) => s.paymentMethod === "tarjeta_debito").length} vtas débito
              </div>
            </div>

            {/* Credit Card Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-purple-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-[9.5px] font-black uppercase tracking-wider">T. Crédito</span>
                <CreditCard className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div className="text-lg font-black text-purple-700 font-mono">
                ${creditCardSales.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-purple-600 font-medium">
                {filteredSales.filter((s) => s.paymentMethod === "tarjeta_credito").length} vtas crédito
              </div>
            </div>

            {/* Transfer Sales Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-indigo-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-indigo-700">
                <span className="text-[9.5px] font-black uppercase tracking-wider">Transferencias</span>
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="text-lg font-black text-indigo-700 font-mono">
                ${transferSales.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-indigo-600 font-medium">
                {filteredSales.filter((s) => s.paymentMethod === "transferencia").length} vtas digital
              </div>
            </div>

            {/* Credit / Fiado Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[9.5px] font-black uppercase tracking-wider">Cta. Corriente</span>
                <Receipt className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="text-lg font-black text-amber-800 font-mono">
                ${creditSales.toLocaleString("es-AR")}
              </div>
              <div className="text-[9.5px] text-amber-700 font-medium">
                {filteredSales.filter((s) => s.paymentMethod === "cuenta_corriente").length} vtas fiado
              </div>
            </div>
          </div>

          {/* MAIN CASH BALANCING AUDIT SECTION */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                    Calculadora y Arqueo de Dinero en Cajón
                  </h4>
                  <p className="text-xs text-slate-500">
                    Compare el efectivo esperado según el sistema contra el dinero físico real
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                Control Antidesfasaje
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1: Fondo Inicial */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  1. Fondo de Caja Inicial (Apertura)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="10000"
                  />
                </div>
                <span className="text-[9.5px] text-slate-400 block">Cambio con el que abrió el turno</span>
              </div>

              {/* Step 2: Egresos de Caja Chica */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <label className="block text-[10px] font-black uppercase text-slate-500">
                  2. Egresos / Retiros de Caja Chica (-)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-red-600"
                    placeholder="0"
                  />
                </div>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="Motivo del egreso (ej. pago proveedor)..."
                  className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg outline-none text-slate-600"
                />
              </div>

              {/* Step 3: Efectivo Contado Real en Cajón */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2">
                <label className="block text-[10px] font-black uppercase text-indigo-950 flex items-center justify-between">
                  <span>3. Conteo Físico Real en Caja</span>
                  <span className="text-[9px] text-indigo-600 font-extrabold">INGRESAR AHORA</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-indigo-600">$</span>
                  <input
                    type="number"
                    value={actualCashCounted}
                    onChange={(e) => setActualCashCounted(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-black font-mono bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-indigo-900"
                    placeholder="Ingrese el dinero contado..."
                  />
                </div>
                <span className="text-[9.5px] text-indigo-700 font-medium block">
                  Sumatoria total de billetes y monedas en el cajón
                </span>
              </div>
            </div>

            {/* AUDIT BALANCE COMPARISON DASHBOARD */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                {/* Expected Cash calculated */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Efectivo Esperado (Teórico)
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ${expectedCashInDrawer.toLocaleString("es-AR")}
                  </div>
                  <span className="text-[9.5px] text-slate-400 block">
                    (Fondo ${numInitial.toLocaleString("es-AR")} + Ventas $
                    {cashSales.toLocaleString("es-AR")} - Egresos $
                    {numExpenses.toLocaleString("es-AR")})
                  </span>
                </div>

                {/* Actual Counted */}
                <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Efectivo Ingresado (Real)
                  </span>
                  <div className="text-2xl font-black font-mono text-white">
                    {numActualCounted !== null ? `$${numActualCounted.toLocaleString("es-AR")}` : "---"}
                  </div>
                  <span className="text-[9.5px] text-slate-400 block">
                    Dinero contado en el arqueo físico
                  </span>
                </div>

                {/* Difference Result */}
                <div className="space-y-1 pt-3 md:pt-0 md:pl-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Resultado del Arqueo / Diferencia
                  </span>
                  {numActualCounted === null ? (
                    <div className="text-sm font-bold text-slate-400 italic pt-1">
                      Ingrese el dinero contado arriba para ver el balance
                    </div>
                  ) : cashDifference === 0 ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl font-mono font-black text-lg">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>CUADRE EXACTO ($0,00)</span>
                    </div>
                  ) : cashDifference > 0 ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl font-mono font-black text-lg">
                      <PlusCircle className="h-5 w-5" />
                      <span>SOBRANTE: +${cashDifference.toLocaleString("es-AR")}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl font-mono font-black text-lg">
                      <AlertTriangle className="h-5 w-5" />
                      <span>FALTANTE: -${Math.abs(cashDifference).toLocaleString("es-AR")}</span>
                    </div>
                  )}
                  <span className="text-[9.5px] text-slate-400 block">
                    {cashDifference < 0
                      ? "⚠️ Falta dinero en la caja respecto a las ventas registradas"
                      : cashDifference > 0
                      ? " Hay más dinero en la caja del registrado"
                      : "🎉 La caja coincide perfectamente con el sistema"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SELLER REVENUE BREAKDOWN TABLE */}
          {sellerBreakdown.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Users className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Recaudación y Rendimiento por Vendedor (Jornada)
                </h4>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3">Vendedor</th>
                      <th className="p-3 text-center">Tickets</th>
                      <th className="p-3 text-right text-emerald-700">Efectivo</th>
                      <th className="p-3 text-right text-indigo-700">Transferencia</th>
                      <th className="p-3 text-right text-amber-700">Cta. Cte.</th>
                      <th className="p-3 text-right font-black">Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sellerBreakdown.map((sb, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{sb.name}</td>
                        <td className="p-3 text-center text-slate-600 font-mono font-medium">
                          {sb.count} vtas
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          ${sb.cash.toLocaleString("es-AR")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-700">
                          ${sb.transfer.toLocaleString("es-AR")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700">
                          ${sb.credit.toLocaleString("es-AR")}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">
                          ${sb.total.toLocaleString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NOTES & JUSTIFICATIONS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700 tracking-wider">
              Observaciones o Justificaciones del Cierre de Caja
            </label>
            <textarea
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Ingrese notas o justificaciones de faltante/sobrante para la administración..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none h-18 resize-none"
            />
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cierre registrado en base de datos</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleDownloadPDFReport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
              title="Descargar o imprimir comprobante oficial de balance de caja en PDF"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Imprimir / PDF Balance</span>
            </button>

            <button
              type="button"
              onClick={handleOfficialClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 shadow-md shadow-emerald-600/20"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Cerrar Jornada Oficialmente</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
