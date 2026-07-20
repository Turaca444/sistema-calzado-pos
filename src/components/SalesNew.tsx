import React, { useState } from "react";
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
  DollarSign
} from "lucide-react";
import { Product, Customer } from "../types";
import { exportFacturaB } from "../utils/facturaPDF";

interface SalesNewProps {
  products: Product[];
  customers: Customer[];
  onAddSale: (saleData: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: "contado" | "transferencia" | "cuenta_corriente";
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
  
  // Checkout details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("cust_anonymous");
  const [paymentMethod, setPaymentMethod] = useState<"contado" | "transferencia" | "cuenta_corriente">("contado");
  const [cashReceived, setCashReceived] = useState<string>("");

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

  // Form submit handler
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      setError("El carrito está vacío. Agrega artículos antes de facturar.");
      return;
    }

    if (selectedCustomerId === "cust_anonymous" && paymentMethod === "cuenta_corriente") {
      setError("No se permite comprar a Cuenta Corriente con el Consumidor Final.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const saleData = {
        customerId: selectedCustomerId,
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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Calculate change for cash payment
  const numericCash = Number(cashReceived);
  const changeDue = (!isNaN(numericCash) && numericCash >= cartTotal) ? (numericCash - cartTotal) : 0;

  // View transition when completed
  const handleReset = () => {
    setSuccessData(null);
    setSelectedCustomerId("cust_anonymous");
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
            <span>Ticket: #{invoice.id}</span>
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
                  {c.name} {c.id !== "cust_anonymous" && c.debt > 0 ? `(Debe $${c.debt.toLocaleString()})` : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedCustomer && selectedCustomer.id !== "cust_anonymous" && (
            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 flex flex-col space-y-0.5 border border-slate-100">
              <span>Email: {selectedCustomer.email || "-"}</span>
              <span>Deuda Pendiente: <strong className={selectedCustomer.debt > 0 ? "text-red-500 font-bold" : "text-emerald-500"}>${selectedCustomer.debt.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* 2. Select Payment Method */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Forma de Pago *</label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Contado */}
            <button
              type="button"
              onClick={() => setPaymentMethod("contado")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "contado"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <DollarSign className="h-4.5 w-4.5 mb-1 shrink-0" />
              <span className="text-[10px] font-bold">Contado</span>
            </button>

            {/* Transferencia */}
            <button
              type="button"
              onClick={() => setPaymentMethod("transferencia")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                paymentMethod === "transferencia"
                  ? "bg-blue-50 text-blue-800 border-blue-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <CreditCard className="h-4.5 w-4.5 mb-1 shrink-0" />
              <span className="text-[10px] font-bold">Transferencia</span>
            </button>

            {/* Cuenta Corriente (Fiado/Debe) */}
            <button
              type="button"
              disabled={selectedCustomerId === "cust_anonymous"}
              onClick={() => setPaymentMethod("cuenta_corriente")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedCustomerId === "cust_anonymous"
                  ? "opacity-45 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  : paymentMethod === "cuenta_corriente"
                  ? "bg-red-50 text-red-800 border-red-500 shadow-sm"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title={selectedCustomerId === "cust_anonymous" ? "El Consumidor Final no puede usar cuenta corriente" : "Comprar al fiado / cargar saldo"}
            >
              <FileText className="h-4.5 w-4.5 mb-1 shrink-0" />
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
    </div>
  );
}
