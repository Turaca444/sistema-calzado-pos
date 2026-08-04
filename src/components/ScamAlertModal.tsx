import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  X, 
  Volume2, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Smartphone, 
  FileText, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  Info, 
  Zap,
  ShieldCheck,
  Building2,
  Receipt
} from "lucide-react";

interface ScamAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUserName?: string;
}

interface ScamReport {
  id: string;
  date: string;
  amount: number;
  suspectName: string;
  fraudType: string;
  sellerName: string;
  notes: string;
}

export default function ScamAlertModal({ isOpen, onClose, activeUserName = "Vendedor" }: ScamAlertModalProps) {
  const [alarmActive, setAlarmActive] = useState(false);
  
  // Checklist state
  const [checks, setChecks] = useState({
    acreditedInApp: false,
    noScreenshot: false,
    cuitMatches: false,
    notScheduled: false,
    verifiedAmount: false
  });

  // Scam reports history state
  const [scamReports, setScamReports] = useState<ScamReport[]>(() => {
    try {
      const saved = localStorage.getItem("jz_scam_reports");
      return saved ? JSON.parse(saved) : [
        {
          id: "1",
          date: new Date().toLocaleDateString("es-AR") + " 11:30 hs",
          amount: 48500,
          suspectName: "Cliente Sospechoso (App Falsa MP)",
          fraudType: "Mercado Pago Falso (APK Clonada)",
          sellerName: activeUserName,
          notes: "Mostró comprobante verde en pantalla pero la plata nunca ingresó en la app de la caja."
        }
      ];
    } catch {
      return [];
    }
  });

  // Report form state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportAmount, setReportAmount] = useState("");
  const [reportSuspect, setReportSuspect] = useState("");
  const [reportFraudType, setReportFraudType] = useState("Mercado Pago Falso (APK Clonada)");
  const [reportNotes, setReportNotes] = useState("");

  const playWarningAudio = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 350);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAlarm = () => {
    setAlarmActive(!alarmActive);
    if (!alarmActive) {
      playWarningAudio();
    }
  };

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checks).every(Boolean);

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: ScamReport = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("es-AR") + " " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      amount: parseFloat(reportAmount) || 0,
      suspectName: reportSuspect || "No identificado",
      fraudType: reportFraudType,
      sellerName: activeUserName,
      notes: reportNotes
    };

    const updated = [newReport, ...scamReports];
    setScamReports(updated);
    localStorage.setItem("jz_scam_reports", JSON.stringify(updated));

    setReportAmount("");
    setReportSuspect("");
    setReportNotes("");
    setShowReportForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl max-w-3xl w-full border overflow-hidden shadow-2xl transition-all ${
        alarmActive ? "border-red-600 ring-8 ring-red-500/30" : "border-slate-200"
      }`}>
        
        {/* Header Alert Banner */}
        <div className={`p-5 md:p-6 text-white flex items-center justify-between relative ${
          alarmActive ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 animate-pulse" : "bg-gradient-to-r from-slate-900 via-slate-800 to-red-950"
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-red-500/20 rounded-2xl border border-red-400/30 backdrop-blur-md shrink-0">
              <ShieldAlert className="h-7 w-7 text-red-400 animate-bounce" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-red-500/30 border border-red-400/40 text-[10px] font-extrabold uppercase tracking-widest text-red-200">
                <span>Protocolo Anti-Fraude en Caja</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-white leading-tight mt-0.5">
                Alerta de Estafa & Verificación
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alarm Banner Control */}
        <div className="p-4 bg-red-50 border-b border-red-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-red-900">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="text-xs font-bold leading-tight">
              <span>REGLA DE ORO DE CAJA: </span>
              <span className="font-normal text-red-800">
                Nunca entregues mercadería basándote sólo en la pantalla del celular del cliente. Verificá la acreditación real en la App de la caja.
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleAlarm}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs ${
              alarmActive 
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse" 
                : "bg-white text-red-700 border border-red-300 hover:bg-red-100"
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>{alarmActive ? "🚨 Desactivar Alarma" : "🔊 Probar Alarma de Caja"}</span>
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* 1. Interactive Checklist */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Checklist Rápido antes de entregar el paquete:</h3>
              </div>
              <span className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-full ${
                allChecked ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {allChecked ? "✅ COMPROBANTE VERIFICADO" : "⚠️ VERIFICACIÓN PENDIENTE"}
              </span>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => toggleCheck("acreditedInApp")}
                className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-3 cursor-pointer"
              >
                {checks.acreditedInApp ? <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" /> : <Square className="h-5 w-5 text-slate-400 shrink-0" />}
                <span className="text-xs font-semibold text-slate-800">
                  1. Miraste TU PROPIA APP de Mercado Pago / Banco en la caja y el saldo extra figuraba ingresado.
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck("noScreenshot")}
                className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-3 cursor-pointer"
              >
                {checks.noScreenshot ? <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" /> : <Square className="h-5 w-5 text-slate-400 shrink-0" />}
                <span className="text-xs font-semibold text-slate-800">
                  2. Confirmaste que NO es una captura de pantalla estática ni un video grabado en el celular del cliente.
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck("cuitMatches")}
                className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-3 cursor-pointer"
              >
                {checks.cuitMatches ? <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" /> : <Square className="h-5 w-5 text-slate-400 shrink-0" />}
                <span className="text-xs font-semibold text-slate-800">
                  3. El CUIT y nombre del titular receptor coinciden exactamente con la cuenta de este negocio.
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleCheck("notScheduled")}
                className="w-full text-left p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-3 cursor-pointer"
              >
                {checks.notScheduled ? <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" /> : <Square className="h-5 w-5 text-slate-400 shrink-0" />}
                <span className="text-xs font-semibold text-slate-800">
                  4. La transferencia NO figura como "Programada para mañana" ni "Diferida / En revisión".
                </span>
              </button>
            </div>
          </div>

          {/* 2. Common Scams Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Modalidades de Estafa Frecuentes en Locales Comerciales</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-900 font-bold">
                  <Smartphone className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>1. App Falsa de Mercado Pago (APK Clonada)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Utilizan celulares modificados con aplicaciones falsas que emulan el diseño verde, tilde de éxito y sonido de Mercado Pago, pero jamás envían dinero real.
                </p>
              </div>

              <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-rose-900 font-bold">
                  <Clock className="h-4 w-4 text-rose-700 shrink-0" />
                  <span>2. Transferencia Diferida / Programada</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Programan el pago para 24/48hs posteriores, muestran la pantalla de tilde verde para apurar al cajero, y anulan la transferencia al retirarse del local.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-purple-900 font-bold">
                  <Receipt className="h-4 w-4 text-purple-700 shrink-0" />
                  <span>3. Comprobantes PDF / WhatsApp Modificados</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Muestran un archivo PDF o imagen editada en Canva/Photoshop con los datos del local pero con un ID de transacción falso o reutilizado.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-900 font-bold">
                  <Building2 className="h-4 w-4 text-blue-700 shrink-0" />
                  <span>4. Estafa de "Pagué de más, devolveme el resto"</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Afirman que te transfirieron por error $150.000 en vez de $15.000 mostrando comprobante falso y exigen devolución en efectivo del excedente.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Incident Audit Log Form */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Registro de Intentos de Fraude en Caja</h3>
                <p className="text-[11px] text-slate-400">Guarda un registro para prevenir a los demás turnos y administradores.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowReportForm(!showReportForm)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Registrar Intento de Estafa</span>
              </button>
            </div>

            {showReportForm && (
              <form onSubmit={handleAddReport} className="bg-slate-800 p-4 rounded-xl space-y-3 border border-slate-700 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Monto Intentado ($)</label>
                    <input
                      type="number"
                      required
                      value={reportAmount}
                      onChange={(e) => setReportAmount(e.target.value)}
                      placeholder="Ej: 35000"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Sospechoso / Nombre</label>
                    <input
                      type="text"
                      value={reportSuspect}
                      onChange={(e) => setReportSuspect(e.target.value)}
                      placeholder="Nombre o descripción"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Tipo de Fraude</label>
                    <select
                      value={reportFraudType}
                      onChange={(e) => setReportFraudType(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    >
                      <option value="Mercado Pago Falso (APK Clonada)">Mercado Pago Falso (APK Clonada)</option>
                      <option value="Transferencia Programada / Cancelada">Transferencia Programada / Cancelada</option>
                      <option value="Comprobante PDF Falso">Comprobante PDF Falso</option>
                      <option value="Billete Falso">Billete Falso</option>
                      <option value="Otro Intento">Otro Intento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Observaciones / Detalles</label>
                  <input
                    type="text"
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    placeholder="Detalles útiles para alertar al resto del personal..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Guardar Incidente
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {scamReports.map((report) => (
                <div key={report.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-red-400">{report.fraudType}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({report.date})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      <strong>Sospechoso:</strong> {report.suspectName} | <strong>Atendió:</strong> {report.sellerName}
                    </p>
                    {report.notes && <p className="text-[10.5px] text-slate-400 italic mt-0.5">{report.notes}</p>}
                  </div>
                  <div className="text-right font-mono font-black text-amber-400 shrink-0">
                    ${report.amount.toLocaleString("es-AR")}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[10.5px] text-slate-500 font-medium flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sistema Anti-Fraude JM SOFTWARE v2.5</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Entendido / Cerrar Alerta
          </button>
        </div>

      </div>
    </div>
  );
}
