import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  DollarSign,
  QrCode,
  Copy,
  Check,
  Maximize2,
  X,
  Building2,
  Smartphone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Product, Customer } from "../types";
import { exportFacturaB } from "../utils/facturaPDF";

interface SalesNewProps {
  products: Product[];
  customers: Customer[];
  onAddSale: (saleData: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: "contado" | "transferencia" | "cuenta_corriente" | "tarjeta_debito" | "tarjeta_credito";
  }) => Promise<{
    message: string;
    sale: any;
    customerDebt: number;
    total: number;
  }>;
  setView: (view: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function SalesNew({ products, customers, onAddSale, setView }: SalesNewProps) {
  // Shopping Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  
  // Helper to find Consumidor Final customer
  const anonCustomer = customers.find(c => c.id.startsWith("cust_anonymous") || c.name.toLowerCase() === "consumidor final");
  const defaultCustomerId = anonCustomer?.id || "cust_anonymous";

  // Checkout details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCustomerId);
  const [paymentMethod, setPaymentMethod] = useState<"contado" | "transferencia" | "cuenta_corriente" | "tarjeta_debito" | "tarjeta_credito">("contado");
  const [cashReceived, setCashReceived] = useState<string>("");

  // QR Code Payment state
  const [cbuAlias, setCbuAlias] = useState<string>(() => {
    return localStorage.getItem("jz_cbu_alias") || "JZ.INDUMENTARIA.MP";
  });
  const [cbuNumber, setCbuNumber] = useState<string>(() => {
    return localStorage.getItem("jz_cbu_number") || "0000003100084729103847";
  });
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveQrConfig = (newAlias: string, newCbu: string) => {
    setCbuAlias(newAlias);
    setCbuNumber(newCbu);
    localStorage.setItem("jz_cbu_alias", newAlias);
    localStorage.setItem("jz_cbu_number", newCbu);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sync selectedCustomerId when customers array changes or initial load
  useEffect(() => {
    if (customers.length > 0) {
      const exists = customers.some(c => c.id === selectedCustomerId);
      if (!exists) {
        const found = customers.find(c => c.id.startsWith("cust_anonymous") || c.name.toLowerCase() === "consumidor final");
        setSelectedCustomerId(found ? found.id : customers[0].id);
      }
    }
  }, [customers]);

  // Transaction feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    sale: any;
    customerDebt: number;
    total: number;
  } | null>(null);

  const categories = ["Todos", "Ropa", "Calzado", "Accesorios"];

  // Filter available products for selection
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "Todos" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`No hay stock disponible para "${product.name}".`);
      return;
    }

    const existingIdx = cart.findIndex((item) => item.product.id === product.id);
    if (existingIdx !== -1) {
      const currentQty = cart[existingIdx].quantity;
      if (currentQty >= product.stock) {
        alert(`No puedes agregar más unidades. El stock disponible de "${product.name}" es ${product.stock}.`);
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const idx = cart.findIndex((item) => item.product.id === productId);
    if (idx === -1) return;

    const item = cart[idx];
    const targetQty = item.quantity + delta;

    if (targetQty <= 0) {
      removeFromCart(productId);
    } else if (targetQty > item.product.stock) {
      alert(`Stock insuficiente. Solo quedan ${item.product.stock} unidades de "${item.product.name}".`);
    } else {
      const updated = [...cart];
      updated[idx].quantity = targetQty;
      setCart(updated);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) ||
    customers.find(c => c.id.startsWith("cust_anonymous") || c.name.toLowerCase() === "consumidor final");

  const isAnonymousSelected = selectedCustomerId.startsWith("cust_anonymous") ||
    selectedCustomer?.name.toLowerCase() === "consumidor final";

  // Form submit handler
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      setError("El carrito está vacío. Agrega artículos antes de facturar.");
      return;
    }

    if (isAnonymousSelected && paymentMethod === "cuenta_corriente") {
      setError("No se permite comprar a Cuenta Corriente con el Consumidor Final.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const effectiveCustId = selectedCustomer ? selectedCustomer.id : selectedCustomerId;
      const saleData = {
        customerId: effectiveCustId,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        paymentMethod
      };

      const res = await onAddSale(saleData);
      setSuccessData({
        sale: res.sale,
        customerDebt: res.customerDebt,
        total: res.total
      });
      // Clear cart on success
      setCart([]);
    } catch (err: any) {
      setError(err.message || "Error al realizar la venta.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate change for cash payment
  const numericCash = Number(cashReceived);
  const changeDue = (!isNaN(numericCash) && numericCash >= cartTotal) ? (numericCash - cartTotal) : 0;

  // View transition when completed
  const handleReset = () => {
    setSuccessData(null);
    const foundAnon = customers.find(c => c.id.startsWith("cust_anonymous") || c.name.toLowerCase() === "consumidor final");
    setSelectedCustomerId(foundAnon ? foundAnon.id : (customers[0]?.id || "cust_anonymous"));
    setPaymentMethod("contado");
    setCashReceived("");
    setCart([]);
    setError("");
  };

  if (successData) {
    const invoice = successData.sale;
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden p-8 flex flex-col items-center">
        <div className="h-14 w-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold font-display text-slate-900 text-center">¡Venta Registrada!</h2>
        <p className="text-sm text-slate-500 text-center mt-1">
          La transacción se procesó con éxito y el stock fue descontado.
        </p>

        {/* Invoice Receipt Detail */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 mt-6 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Factura Nro: <strong className="text-indigo-600 font-bold">{invoice.invoiceNumber || `#${invoice.id}`}</strong></span>
            <span>{new Date(invoice.date).toLocaleString("es-AR")}</span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cliente</span>
            <span className="text-sm font-bold text-slate-800">{invoice.customerName}</span>
          </div>

          <div className="space-y-2 border-t border-dashed border-slate-200 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Artículos Vendidos</span>
            {invoice.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">{item.productName} (x{item.quantity})</span>
                <span className="text-slate-900 font-bold">${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
            <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
              <span>Total Abonado:</span>
              <span>${invoice.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Método de Pago:</span>
              <span className="text-indigo-600 font-bold uppercase tracking-wider">{invoice.paymentMethod === "cuenta_corriente" ? "Cuenta Corriente" : invoice.paymentMethod}</span>
            </div>
            {invoice.paymentMethod === "cuenta_corriente" && (
              <div className="flex justify-between items-center text-xs bg-red-50 text-red-800 font-bold p-2.5 rounded-lg border border-red-100">
                <span>Nueva Deuda Acumulada:</span>
                <span className="font-mono">${successData.customerDebt.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 mt-8">
          <button
            onClick={() => exportFacturaB(invoice, selectedCustomer)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Descargar Factura Tipo B (PDF)</span>
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => setView("history")}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
            >
              Ver Historial General
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1.5"
            >
              <span>Facturar Otra Compra</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Column 1: Catalog Selector (8 columns) */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">Nueva Operación</h2>
          <p className="text-sm text-slate-500 mt-1">
            Arma el carrito de compras seleccionando los productos del stock.
          </p>
        </div>

        {/* Product Catalog search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar artículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all ${
                    categoryFilter === cat
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 text-center text-slate-400 text-xs py-12">
                No hay productos en inventario que coincidan.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOut = p.stock === 0;
                
                return (
                  <div 
                    key={p.id}
                    onClick={() => !isOut && addToCart(p)}
                    className={`p-4 border rounded-xl flex items-center justify-between text-left transition-all ${
                      isOut 
                        ? "bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed" 
                        : "bg-white border-slate-200/80 hover:border-indigo-500 hover:shadow-md cursor-pointer group"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-semibold text-slate-800 truncate block group-hover:text-indigo-600 transition-colors">{p.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1 block font-medium">{p.category}</span>
                      <span className="text-xs font-bold text-slate-900 mt-1 block">${p.price.toLocaleString()}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOut 
                          ? "bg-red-50 text-red-800 border border-red-100" 
                          : p.stock <= p.minStock 
                          ? "bg-amber-50 text-amber-800 border border-amber-100" 
                          : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      }`}>
                        {isOut ? "Sin stock" : `${p.stock} u.`}
                      </span>
                      {!isOut && (
                        <span className="block mt-2 text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          + Agregar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Current Cart Item details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold font-display text-slate-900">Carrito de Venta</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} prendas
            </span>
          </div>

          {cart.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              El carrito de venta está vacío. Selecciona artículos para agregarlos aquí.
            </div>
          ) : (
            <div className="space-y-3.5 divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
              {cart.map((item, idx) => (
                <div key={item.product.id} className={`flex items-center justify-between pt-3 ${idx === 0 ? "pt-0 border-t-0" : ""}`}>
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="text-xs font-semibold text-slate-900 block truncate">{item.product.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">${item.product.price.toLocaleString()} c/u</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 px-2.5 min-w-[20px] text-center font-mono">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <span className="text-xs font-bold text-slate-900">${(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-red-500 p-1.5 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Customer & Payment Checkout details (5 columns) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sticky top-6 space-y-6">
        <div>
          <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3">Detalle de Facturación</h3>
          <p className="text-xs text-slate-400 mt-1">Configura el cliente y la modalidad de cobro.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-start space-x-1">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Select Customer */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Seleccionar Cliente *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                // Reset payment to contado if switching to anonymous (no debt)
                if (e.target.value === "cust_anonymous" && paymentMethod === "cuenta_corriente") {
                  setPaymentMethod("contado");
                }
              }}
              className="w-full text-xs font-semibold text-slate-700 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.dni ? `(DNI: ${c.dni})` : ""} {c.id !== "cust_anonymous" && c.debt > 0 ? `- Debe $${c.debt.toLocaleString()}` : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedCustomer && selectedCustomer.id !== "cust_anonymous" && (
            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 flex flex-col space-y-0.5 border border-slate-100">
              {selectedCustomer.dni && <span>DNI: <strong className="text-slate-700">{selectedCustomer.dni}</strong></span>}
              <span>Email: {selectedCustomer.email || "-"}</span>
              <span>Deuda Pendiente: <strong className={selectedCustomer.debt > 0 ? "text-red-500 font-bold" : "text-emerald-500"}>${selectedCustomer.debt.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* 2. Select Payment Method */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Forma de Pago *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Contado / Efectivo */}
            <button
              type="button"
              onClick={() => setPaymentMethod("contado")}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "contado"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <DollarSign className="h-4 w-4 mb-1 shrink-0 text-emerald-600" />
              <span className="text-[10px] font-bold">Efectivo</span>
            </button>

            {/* Tarjeta Débito */}
            <button
              type="button"
              onClick={() => setPaymentMethod("tarjeta_debito")}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "tarjeta_debito"
                  ? "bg-cyan-50 text-cyan-800 border-cyan-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <CreditCard className="h-4 w-4 mb-1 shrink-0 text-cyan-600" />
              <span className="text-[10px] font-bold">T. Débito</span>
            </button>

            {/* Tarjeta Crédito */}
            <button
              type="button"
              onClick={() => setPaymentMethod("tarjeta_credito")}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "tarjeta_credito"
                  ? "bg-purple-50 text-purple-800 border-purple-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <CreditCard className="h-4 w-4 mb-1 shrink-0 text-purple-600" />
              <span className="text-[10px] font-bold">T. Crédito</span>
            </button>

            {/* Transferencia / QR MercadoPago */}
            <button
              type="button"
              onClick={() => setPaymentMethod("transferencia")}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "transferencia"
                  ? "bg-blue-50 text-blue-800 border-blue-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <QrCode className="h-4 w-4 mb-1 shrink-0 text-blue-600" />
              <span className="text-[10px] font-bold">Transfer / QR</span>
            </button>

            {/* Cuenta Corriente (Fiado/Debe) */}
            <button
              type="button"
              disabled={selectedCustomerId === "cust_anonymous"}
              onClick={() => setPaymentMethod("cuenta_corriente")}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all col-span-2 sm:col-span-1 ${
                selectedCustomerId === "cust_anonymous"
                  ? "opacity-45 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : paymentMethod === "cuenta_corriente"
                  ? "bg-red-50 text-red-800 border-red-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title={selectedCustomerId === "cust_anonymous" ? "El Consumidor Final no puede usar cuenta corriente" : "Comprar al fiado / cargar saldo"}
            >
              <FileText className="h-4 w-4 mb-1 shrink-0 text-red-500" />
              <span className="text-[10px] font-bold">Cta. Cte (Debe)</span>
            </button>
          </div>
          {selectedCustomerId === "cust_anonymous" && (
            <span className="text-[10px] text-slate-400 mt-1 block">
              💡 Para habilitar Cuenta Corriente, selecciona un cliente específico.
            </span>
          )}
        </div>

        {/* 3. Cash Register Calculator (for Cash payment method) */}
        {paymentMethod === "contado" && cartTotal > 0 && (
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Calculadora de Cambio (Efectivo)</span>
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Efectivo Recibido:</label>
                <input
                  type="number"
                  placeholder="Ej. 50000"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex flex-col justify-end text-right">
                <span className="text-[10px] text-slate-400 font-semibold">Vuelto a entregar:</span>
                <span className={`text-sm font-extrabold font-mono mt-1 ${changeDue > 0 ? "text-emerald-600 animate-pulse" : "text-slate-500"}`}>
                  ${changeDue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3b. QR Code Payment Box (for Transfer / MercadoPago) */}
        {paymentMethod === "transferencia" && (
          <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/60 p-4 rounded-xl border border-blue-200/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">Cobro con QR / Transferencia</h4>
                  <p className="text-[10px] text-slate-500">Mercado Pago, Modo o Banco</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10.5px] font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                title="Ampliar QR para mostrar al cliente"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Ampliar QR</span>
              </button>
            </div>

            <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
              <div 
                className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs shrink-0 cursor-pointer hover:border-blue-400 transition-colors" 
                onClick={() => setShowQrModal(true)}
                title="Hacé click para ampliar"
              >
                <QRCodeSVG
                  value={`https://link.mercadopago.com.ar/pay?alias=${encodeURIComponent(cbuAlias)}&amount=${cartTotal}&concept=Compra%20JZ`}
                  size={76}
                  level="M"
                />
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alias Mercado Pago</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cbuAlias, "alias")}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-0.5 cursor-pointer"
                  >
                    {copiedField === "alias" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === "alias" ? "¡Copiado!" : "Copiar"}</span>
                  </button>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800 truncate bg-slate-50 px-2 py-1 rounded border border-slate-200/60">
                  {cbuAlias}
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Monto a abonar:</span>
                  <span className="text-xs font-mono font-black text-blue-700">${cartTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center font-medium">
              📲 Escanea el código con Mercado Pago o cualquier billetera virtual.
            </p>
          </div>
        )}

        {/* 4. Invoice Summary totals */}
        <div className="bg-slate-50 p-4.5 border border-slate-100 rounded-xl space-y-2 font-medium">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Subtotal de Artículos</span>
            <span className="font-mono">${cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Impuestos / Tasas</span>
            <span className="font-mono">$0</span>
          </div>
          <div className="border-t border-slate-200/50 my-1.5"></div>
          <div className="flex justify-between items-center text-slate-900 font-bold">
            <span className="text-sm font-display">Total Venta</span>
            <span className="text-lg font-mono">${cartTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="button"
          onClick={handleCheckoutSubmit}
          disabled={loading || cart.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-sm py-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2"
        >
          <span>{loading ? "Procesando Venta..." : "Finalizar Venta & Cobrar"}</span>
        </button>
      </div>

      {/* Fullscreen / Display QR Modal for Customer Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden text-center flex flex-col items-center p-6 space-y-5 relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Badge */}
            <div className="space-y-1 pt-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-700 text-xs font-bold">
                <QrCode className="h-3.5 w-3.5" />
                <span>Cobro Digital Mercado Pago / Transferencia</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 font-display">J&Z Indumentaria</h3>
              <p className="text-xs text-slate-500">Escaneá con tu celular para abonar tu compra</p>
            </div>

            {/* Total Amount Banner */}
            <div className="w-full bg-slate-900 text-white py-3 px-4 rounded-2xl space-y-0.5 shadow-md">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Monto Total a Pagar</span>
              <div className="text-2xl font-black font-mono text-emerald-400">
                ${cartTotal.toLocaleString("es-AR")}
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-blue-500/30 shadow-lg relative group">
              <QRCodeSVG
                value={`https://link.mercadopago.com.ar/pay?alias=${encodeURIComponent(cbuAlias)}&amount=${cartTotal}&concept=Compra%20JZ`}
                size={210}
                level="M"
                includeMargin={true}
              />
              <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center justify-center space-x-1">
                <Smartphone className="h-3 w-3 text-blue-600" />
                <span>Compatible con MP, Modo y Billeteras Virtuales</span>
              </div>
            </div>

            {/* Alias / CBU Copy Box */}
            <div className="w-full space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Alias Mercado Pago:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cbuAlias, "aliasModal")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                >
                  {copiedField === "aliasModal" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedField === "aliasModal" ? "¡Copiado!" : "Copiar"}</span>
                </button>
              </div>
              <div className="font-mono text-sm font-black text-slate-800 bg-white p-2 rounded-xl border border-slate-200 tracking-wide text-center">
                {cbuAlias}
              </div>

              {/* Editable CBU/Alias accordion */}
              <div className="pt-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Configurar Alias de Cobro:
                </label>
                <input
                  type="text"
                  value={cbuAlias}
                  onChange={(e) => handleSaveQrConfig(e.target.value, cbuNumber)}
                  placeholder="Ej. JZ.INDUMENTARIA.MP"
                  className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Action buttons */}
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Listo / Volver a Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
