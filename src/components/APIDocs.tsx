import React, { useState } from "react";
import { 
  Terminal, 
  Play, 
  CheckCircle, 
  HelpCircle, 
  Copy, 
  Cpu, 
  Activity, 
  ArrowRight,
  Code2,
  ChevronRight,
  Check
} from "lucide-react";

export default function APIDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("get_products");
  const [apiResponse, setApiResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    {
      id: "get_products",
      method: "GET",
      path: "/api/products",
      description: "Obtener todos los productos de la tienda con su stock disponible.",
      payload: null,
      codeExample: `fetch('/api/products')\n  .then(res => res.json())\n  .then(products => console.log(products));`
    },
    {
      id: "post_products",
      method: "POST",
      path: "/api/products",
      description: "Agregar un nuevo artículo al catálogo.",
      payload: {
        name: "Saco de Invierno Premium",
        category: "Ropa",
        price: 95000,
        cost: 45000,
        stock: 12,
        minStock: 2
      },
      codeExample: `fetch('/api/products', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    name: "Saco de Invierno Premium",\n    category: "Ropa",\n    price: 95000,\n    stock: 12,\n    minStock: 2\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`
    },
    {
      id: "get_customers",
      method: "GET",
      path: "/api/customers",
      description: "Obtener clientes, sus deudas acumuladas y los artículos específicos que adeudan.",
      payload: null,
      codeExample: `fetch('/api/customers')\n  .then(res => res.json())\n  .then(customers => console.log(customers));`
    },
    {
      id: "post_sales",
      method: "POST",
      path: "/api/sales",
      description: "Registrar una venta. Reduce el stock del artículo y carga la deuda al cliente si es cuenta corriente.",
      payload: {
        customerId: "cust_1",
        items: [
          { productId: "prod_1", quantity: 2 }
        ],
        paymentMethod: "cuenta_corriente"
      },
      codeExample: `fetch('/api/sales', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    customerId: "cust_1",\n    items: [\n      { productId: "prod_1", quantity: 2 }\n    ],\n    paymentMethod: "cuenta_corriente"\n  })\n})\n.then(res => res.json())\n.then(result => console.log(result));`
    },
    {
      id: "post_pay_debt",
      method: "POST",
      path: "/api/customers/cust_1/pay-debt",
      description: "Registrar un pago de deuda de un cliente, liberando artículos adeudados en orden cronológico.",
      payload: {
        amount: 15000
      },
      codeExample: `fetch('/api/customers/cust_1/pay-debt', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    amount: 15000\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`
    },
    {
      id: "put_products",
      method: "PUT",
      path: "/api/products/:id",
      description: "Actualizar datos de un artículo (precio, stock, nombre, etc.).",
      payload: {
        price: 18000,
        stock: 15
      },
      codeExample: `fetch('/api/products/prod_123', {\n  method: 'PUT',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    price: 18000,\n    stock: 15\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`
    },
    {
      id: "delete_products",
      method: "DELETE",
      path: "/api/products/:id",
      description: "Eliminar un artículo del catálogo de forma permanente. No altera ventas históricas.",
      payload: null,
      codeExample: `fetch('/api/products/prod_123', {\n  method: 'DELETE'\n})\n.then(res => res.json())\n.then(data => console.log(data));`
    },
    {
      id: "delete_customers",
      method: "DELETE",
      path: "/api/customers/:id",
      description: "Eliminar un cliente de la base de datos.",
      payload: null,
      codeExample: `fetch('/api/customers/cust_123', {\n  method: 'DELETE'\n})\n.then(res => res.json())\n.then(data => console.log(data));`
    }
  ];

  const current = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(current.codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAPI = async () => {
    setLoading(true);
    setApiResponse("");
    try {
      let url = current.path;

      // Smart dynamic replacement of :id for testing live in sandbox
      if (url.includes("/api/products/:id")) {
        try {
          const resProd = await fetch("/api/products");
          const products = await resProd.json();
          if (products && products.length > 0) {
            url = url.replace(":id", products[0].id);
          } else {
            url = url.replace(":id", "prod_fallback");
          }
        } catch {
          url = url.replace(":id", "prod_fallback");
        }
      } else if (url.includes("/api/customers/:id") || url.includes("/api/customers/cust_1/pay-debt")) {
        try {
          const resCust = await fetch("/api/customers");
          const customers = await resCust.json();
          // Filter out anonymous customer if we want to test specific things, or just pick any
          const realCustomers = customers.filter((c: any) => c.id !== "cust_anonymous");
          const target = realCustomers.length > 0 ? realCustomers[0] : (customers[0] || { id: "cust_1" });
          url = url.replace(":id", target.id).replace("cust_1", target.id);
        } catch {
          url = url.replace(":id", "cust_1");
        }
      }

      const options: RequestInit = {
        method: current.method,
        headers: {
          "Content-Type": "application/json"
        }
      };
      
      if (current.payload) {
        options.body = JSON.stringify(current.payload);
      }

      const res = await fetch(url, options);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: "Fallo en la comunicación con el servidor", message: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">REST API Sandbox</h2>
          <p className="text-sm text-slate-500 mt-1">
            Esta aplicación está potenciada por una API real. Puedes integrarla, probarla en vivo y consultar sus endpoints.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Endpoints menu selector (4 columns) */}
        <div className="xl:col-span-4 space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Endpoints Disponibles</span>
          <div className="space-y-2">
            {endpoints.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setSelectedEndpoint(e.id);
                  setApiResponse("");
                }}
                className={`w-full p-4 rounded-xl text-left border transition-all flex items-start space-x-3 ${
                  selectedEndpoint === e.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                    : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded font-mono shrink-0 ${
                  e.method === "GET" 
                    ? selectedEndpoint === e.id ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-700"
                    : selectedEndpoint === e.id ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-700"
                }`}>
                  {e.method}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold font-mono truncate">{e.path}</p>
                  <p className={`text-[10px] mt-1 ${selectedEndpoint === e.id ? "text-slate-400" : "text-slate-500"} truncate`}>
                    {e.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 self-center" />
              </button>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-100/60 rounded-xl p-4 text-indigo-800 text-xs space-y-2">
            <span className="font-bold flex items-center space-x-1">
              <Cpu className="h-4 w-4" />
              <span>Deducción de Stock en Ventas</span>
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              El endpoint <code className="font-mono bg-indigo-150/40 px-1 rounded">POST /api/sales</code> procesa la venta validando los stocks en tiempo real. En caso de solicitar más artículos de los que hay disponibles, arrojará un error 400 previniendo saldos negativos en stock.
            </p>
          </div>
        </div>

        {/* Live Playground and Documentation details (8 columns) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Documentación del Endpoint</span>
                <span className="flex items-center space-x-1 text-[11px] text-emerald-600 font-bold">
                  <Activity className="h-3 w-3" />
                  <span>Activo</span>
                </span>
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900 mt-2 flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-extrabold ${
                  current.method === "GET" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                }`}>
                  {current.method}
                </span>
                <span className="font-mono text-sm font-semibold">{current.path}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{current.description}</p>
            </div>

            {/* Request Payload schema representation */}
            {current.payload && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Request Body (JSON)</span>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-[11px] text-slate-800 overflow-x-auto">
                  <pre>{JSON.stringify(current.payload, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Javascript Client Code Example */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ejemplo de Integración (Fetch API)</span>
                <button
                  onClick={handleCopyCode}
                  className="text-indigo-600 hover:text-indigo-700 font-bold text-[10px] flex items-center space-x-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copiado!" : "Copiar código"}</span>
                </button>
              </div>
              <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner relative group border border-slate-900">
                <pre>{current.codeExample}</pre>
              </div>
            </div>

            {/* Interactive API Client test trigger */}
            <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/40">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Terminal className="h-4 w-4 text-indigo-600" />
                  <span>Prueba Interactiva en vivo</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Haz clic en probar para realizar una consulta asíncrona real y observar la respuesta del backend.
                </p>
              </div>
              <button
                onClick={handleTestAPI}
                disabled={loading}
                className="flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shrink-0"
              >
                <Play className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
                <span>{loading ? "Llamando API..." : "Probar API"}</span>
              </button>
            </div>

            {/* API JSON Output response viewer */}
            {apiResponse && (
              <div className="space-y-2 border-t border-slate-100 pt-6 animate-fadeIn">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Respuesta del Servidor (JSON)</span>
                <div className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-[250px] shadow-lg">
                  <pre>{apiResponse}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
