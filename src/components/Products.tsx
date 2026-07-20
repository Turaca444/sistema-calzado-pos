import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ShoppingBag,
  TrendingUp,
  Tag,
  FolderOpen,
  DollarSign,
  PackageCheck,
  CheckCircle,
  XCircle,
  ChevronDown,
  Copy
} from "lucide-react";
import { Product } from "../types";

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id" | "tenantId">) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function Products({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: ProductsProps) {
  // Local UI State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [stockFilter, setStockFilter] = useState("Todos"); // "Todos", "BajoStock", "SinStock"
  
  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Ropa");
  const [footwearModel, setFootwearModel] = useState("");
  const [footwearNumber, setFootwearNumber] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const categories = ["Todos", "Ropa", "Calzado", "Accesorios"];

  // Helper to parse stored footwear name
  const parseCalzadoName = (fullName: string) => {
    // Matches names like "Zapatilla Nike (Nº 41)" or "Botas Cuero (Nº 38)"
    const regex = /(.*?)\s*\(Nº\s*([^)]+)\)$/;
    const match = fullName.match(regex);
    if (match) {
      return { model: match[1].trim(), number: match[2].trim() };
    }
    
    // Fallback: matches "Zapatilla Nike - Nº 38"
    const regex2 = /(.*?)\s*-\s*Nº\s*(.*)$/;
    const match2 = fullName.match(regex2);
    if (match2) {
      return { model: match2[1].trim(), number: match2[2].trim() };
    }

    return { model: fullName, number: "" };
  };

  // Helper to sync compound footwear name
  const updateFootwearName = (model: string, num: string) => {
    if (model && num) {
      setName(`${model} (Nº ${num})`);
    } else if (model) {
      setName(model);
    } else if (num) {
      setName(`Nº ${num}`);
    } else {
      setName("");
    }
  };

  // Helper to find all other sizes/numbers of the same footwear model
  const getFootwearVariants = (product: Product) => {
    if (product.category !== "Calzado") return [];
    const currentParsed = parseCalzadoName(product.name);
    const currentModel = currentParsed.model.toLowerCase().trim();
    if (!currentModel) return [];

    return products
      .filter((p) => {
        if (p.category !== "Calzado" || p.id === product.id) return false;
        const otherParsed = parseCalzadoName(p.name);
        return otherParsed.model.toLowerCase().trim() === currentModel;
      })
      .map((p) => {
        const otherParsed = parseCalzadoName(p.name);
        return {
          id: p.id,
          number: otherParsed.number || "S/N",
          stock: p.stock,
        };
      })
      .sort((a, b) => {
        const numA = parseFloat(a.number);
        const numB = parseFloat(b.number);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.number.localeCompare(b.number);
      });
  };

  // Helper to find registered sizes for a given raw model name string
  const getExistingNumbersForModel = (modelName: string) => {
    if (!modelName.trim()) return [];
    const searchModel = modelName.trim().toLowerCase();
    
    // Get unique list of numbers registered for this model
    const numbersSet = new Set<string>();
    products.forEach(p => {
      if (p.category === "Calzado") {
        const parsed = parseCalzadoName(p.name);
        if (parsed.model.toLowerCase().trim() === searchModel && parsed.number) {
          numbersSet.add(parsed.number);
        }
      }
    });
    return Array.from(numbersSet).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  };

  // Pre-populates the form with an existing footwear model to easily register a different size (number)
  const handleDuplicateForNewSize = (p: Product) => {
    setCategory(p.category);
    if (p.category === "Calzado") {
      const parsed = parseCalzadoName(p.name);
      setFootwearModel(parsed.model);
      setFootwearNumber(""); // Clear the number so they input the new size
      setName(parsed.model); // Pre-populate name with model name
    } else {
      setName(`${p.name} (Copia)`);
      setFootwearModel("");
      setFootwearNumber("");
    }
    setPrice(p.price.toString());
    setCost(p.cost.toString());
    setStock(""); // Leave stock blank so they enter the stock for the new size
    setMinStock(p.minStock.toString());
    setEditingId(null); // This is a NEW product creation
    setError("");
    setIsFormOpen(true);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === "BajoStock") {
      matchesStock = p.stock <= p.minStock && p.stock > 0;
    } else if (stockFilter === "SinStock") {
      matchesStock = p.stock === 0;
    } else if (stockFilter === "ConStock") {
      matchesStock = p.stock > 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenNewForm = () => {
    setName("");
    setCategory("Ropa");
    setFootwearModel("");
    setFootwearNumber("");
    setPrice("");
    setCost("");
    setStock("");
    setMinStock("5");
    setEditingId(null);
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (p: Product) => {
    setName(p.name);
    setCategory(p.category);
    if (p.category === "Calzado") {
      const parsed = parseCalzadoName(p.name);
      setFootwearModel(parsed.model);
      setFootwearNumber(parsed.number);
    } else {
      setFootwearModel("");
      setFootwearNumber("");
    }
    setPrice(p.price.toString());
    setCost(p.cost.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setEditingId(p.id);
    setError("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price || !stock) {
      setError("Por favor, complete todos los campos obligatorios (*).");
      return;
    }

    const priceNum = Number(price);
    const costNum = cost ? Number(cost) : Math.round(priceNum * 0.5);
    const stockNum = Number(stock);
    const minStockNum = minStock ? Number(minStock) : 5;

    if (isNaN(priceNum) || priceNum < 0) {
      setError("El precio debe ser un número válido mayor o igual a cero.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setError("El stock debe ser un número entero válido mayor o igual a cero.");
      return;
    }

    // Footwear Duplicate Number Check
    if (category === "Calzado") {
      const parsed = parseCalzadoName(name);
      const modelName = parsed.model.toLowerCase().trim();
      const numName = parsed.number.toLowerCase().trim();
      
      const duplicate = products.find(p => {
        if (p.category !== "Calzado" || p.id === editingId) return false;
        const otherParsed = parseCalzadoName(p.name);
        return otherParsed.model.toLowerCase().trim() === modelName && otherParsed.number.toLowerCase().trim() === numName;
      });
      
      if (duplicate) {
        setError(`Ya existe un calzado registrado para "${parsed.model}" con el número "${parsed.number}". Por favor, elija otro número o edite el artículo existente.`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (editingId) {
        await onUpdateProduct(editingId, {
          name,
          category,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          minStock: minStockNum,
        });
      } else {
        await onAddProduct({
          name,
          category,
          price: priceNum,
          cost: costNum,
          stock: stockNum,
          minStock: minStockNum,
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.message || "Error al procesar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (p: Product) => {
    setDeletingProduct(p);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setLoading(true);
    try {
      await onDeleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight text-slate-900">Catálogo de Artículos</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona el inventario, actualiza precios de reventa, costes de adquisición y alertas de stock.</p>
        </div>
        <button
          onClick={handleOpenNewForm}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 w-fit self-end sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Nuevo Artículo</span>
        </button>
      </div>

      {/* Grid of quick inventory info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Artículos Únicos</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{products.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Bajo Stock / Sin Stock</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {products.filter(p => p.stock <= p.minStock).length} artículos
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Valor Estimado del Inventario</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              ${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
          <input
            type="text"
            placeholder="Buscar por nombre de producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category & Stock filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden md:inline">Categoría:</span>
            <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/40 w-full sm:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="Todos">Todos los stocks</option>
            <option value="ConStock">Disponible (&gt;0)</option>
            <option value="BajoStock">Bajo stock (≤ Mínimo)</option>
            <option value="SinStock">Agotado (0 u.)</option>
          </select>
        </div>
      </div>

      {/* Products list layout or side-by-side Form */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        {/* Products list */}
        <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden xl:col-span-3`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Detalle Artículo</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6 text-right">Costo / Reventa</th>
                  <th className="py-4 px-6 text-center">Stock Disponible</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      No se encontraron artículos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLowStock = p.stock <= p.minStock;
                    const isOut = p.stock === 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {p.id}</span>
                            
                            {/* Footwear sibling sizes */}
                            {p.category === "Calzado" && (
                              <div className="mt-2 flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-[8px]">Tallas:</span>
                                {(() => {
                                  const variants = getFootwearVariants(p);
                                  const parsedSelf = parseCalzadoName(p.name);
                                  
                                  return (
                                    <>
                                      {/* Highlight current item size */}
                                      {parsedSelf.number && (
                                        <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white border border-indigo-600 shadow-sm">
                                          Nº {parsedSelf.number} (Actual)
                                        </span>
                                      )}
                                      
                                      {variants.length === 0 ? (
                                        <span className="text-[9px] text-slate-400 font-medium italic bg-slate-50/50 px-1 py-0.5 rounded border border-slate-200 border-dashed">
                                          Único número registrado
                                        </span>
                                      ) : (
                                        variants.map((v) => (
                                          <span 
                                            key={v.id} 
                                            className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                              v.stock === 0 
                                                ? "bg-red-50 text-red-500 border-red-100/60" 
                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                            }`}
                                            title={`Stock disponible: ${v.stock} u.`}
                                          >
                                            Nº {v.number} ({v.stock} u.)
                                          </span>
                                        ))
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/40">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">${p.price.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400">Costo: ${p.cost.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-bold ${
                              isOut 
                                ? "text-red-600" 
                                : isLowStock 
                                ? "text-amber-600" 
                                : "text-emerald-600"
                            }`}>
                              {p.stock} unidades
                            </span>
                            
                            {isOut ? (
                              <span className="flex items-center space-x-0.5 text-[10px] text-red-500 font-semibold mt-0.5 bg-red-50 px-1.5 py-0.5 rounded">
                                <XCircle className="h-2.5 w-2.5" />
                                <span>Agotado</span>
                              </span>
                            ) : isLowStock ? (
                              <span className="flex items-center space-x-0.5 text-[10px] text-amber-500 font-semibold mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span>Bajo ({p.minStock})</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-0.5 text-[10px] text-emerald-500 font-medium mt-0.5">
                                <CheckCircle className="h-2.5 w-2.5" />
                                <span>Óptimo</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleDuplicateForNewSize(p)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Registrar otro número (Talle) de este modelo"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditForm(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar producto"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Embedded Add / Edit Form Panel */}
        {isFormOpen ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sticky top-6">
            <h3 className="text-base font-bold font-display text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span>{editingId ? "Editar Artículo" : "Nuevo Artículo"}</span>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cerrar
              </button>
            </h3>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Categoría *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    if (newCat === "Calzado") {
                      const parsed = parseCalzadoName(name);
                      const modelVal = parsed.model || name;
                      const numVal = parsed.number;
                      setFootwearModel(modelVal);
                      setFootwearNumber(numVal);
                      updateFootwearName(modelVal, numVal);
                    }
                  }}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-semibold text-slate-600"
                >
                  <option value="Ropa">Ropa / Indumentaria</option>
                  <option value="Calzado">Calzado</option>
                  <option value="Accesorios">Accesorios / Otros</option>
                </select>
              </div>

              {category === "Calzado" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Modelo / Nombre del Calzado *</label>
                      <input
                        type="text"
                        placeholder="Ej. Zapatilla Nike Run"
                        value={footwearModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFootwearModel(val);
                          updateFootwearName(val, footwearNumber);
                        }}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Número *</label>
                      <input
                        type="text"
                        placeholder="Ej. 38 o 41.5"
                        value={footwearNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFootwearNumber(val);
                          updateFootwearName(footwearModel, val);
                        }}
                        className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold text-center"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Live preview badge */}
                  <div className="p-2.5 bg-indigo-50/50 border border-indigo-100/40 rounded-xl flex items-center justify-between text-[10px] text-indigo-700">
                    <span className="font-semibold uppercase tracking-wider text-[9px] text-indigo-500">Vista Previa Descripción:</span>
                    <span className="font-black bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm">{name || "Pendiente..."}</span>
                  </div>

                  {/* Registered sizes warning helper */}
                  {footwearModel.trim() && (
                    (() => {
                      const registeredNumbers = getExistingNumbersForModel(footwearModel);
                      if (registeredNumbers.length > 0) {
                        const isCurrentSizeRegistered = registeredNumbers.includes(footwearNumber.trim());
                        return (
                          <div className={`p-2.5 rounded-xl border text-[10px] leading-relaxed ${
                            isCurrentSizeRegistered 
                              ? "bg-red-50/80 border-red-200 text-red-700" 
                              : "bg-amber-50/60 border-amber-200/60 text-amber-800"
                          }`}>
                            <p className="font-bold mb-1 flex items-center">
                              {isCurrentSizeRegistered ? "⚠️ ¡Número ya registrado!" : "ℹ️ Números ya registrados para este calzado:"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {registeredNumbers.map((num) => (
                                <span 
                                  key={num} 
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                    num === footwearNumber.trim()
                                      ? "bg-red-600 text-white border border-red-600"
                                      : "bg-white text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  Nº {num}
                                </span>
                              ))}
                            </div>
                            <p className="mt-1.5 text-[9px] opacity-90">
                              {isCurrentSizeRegistered 
                                ? "Este número ya existe para este calzado. Cambia el número para diferenciarlo." 
                                : "Asegúrate de ingresar un número diferente si estás añadiendo otra variante de talla."
                              }
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nombre del Artículo *</label>
                  <input
                    type="text"
                    placeholder="Ej. Remera de Lino Celeste L"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Costo ($)</label>
                  <input
                    type="number"
                    placeholder="Opcional"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Para utilidades</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Precio Reventa *</label>
                  <input
                    type="number"
                    placeholder="Ej. 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stock Inicial *</label>
                  <input
                    type="number"
                    placeholder="Ej. 10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Stock Mínimo</label>
                  <input
                    type="number"
                    placeholder="Ej. 5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs p-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/15"
              >
                <span>{loading ? "Procesando..." : editingId ? "Guardar Cambios" : "Guardar Producto"}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-100/50 border border-slate-200/60 p-6 rounded-2xl flex flex-col items-center justify-center text-center py-12">
            <span className="p-3 bg-slate-200/50 rounded-xl text-slate-400 mb-3 border border-slate-300/30">
              <Plus className="h-5 w-5" />
            </span>
            <h4 className="text-sm font-bold text-slate-700">Edición rápida</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Selecciona editar o presiona en "Nuevo Artículo" para abrir el formulario interactivo.</p>
          </div>
        )}
      </div>

      {/* Custom elegant delete confirmation modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">¿Eliminar artículo?</h3>
            </div>
            
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Está seguro de que desea eliminar el artículo <strong className="text-slate-900">"{deletingProduct.name}"</strong> del catálogo? Esta acción no se puede deshacer.
            </p>
            
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs mb-5 font-medium flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Importante:</strong> Esta acción no afectará el historial de ventas o transacciones ya registradas con este producto.
              </span>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-red-600/15 flex items-center space-x-1.5"
                disabled={loading}
              >
                {loading ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
