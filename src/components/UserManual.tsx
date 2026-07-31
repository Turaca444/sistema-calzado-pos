import React, { useState } from "react";
import { 
  BookOpen, 
  Download, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Users, 
  ShoppingBag, 
  History, 
  Clock, 
  LogOut, 
  Camera, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Eye, 
  Filter, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  HelpCircle,
  Plus,
  Minus,
  RefreshCw,
  LayoutGrid,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  Info,
  Check
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ButtonGuideItem {
  id: string;
  category: string;
  name: string;
  iconName: string;
  location: string;
  role: string;
  visualBadge: {
    bgClass: string;
    textClass: string;
    borderClass: string;
    icon: React.ElementType;
    label: string;
  };
  summary: string;
  workflow: string[];
  businessRules: string;
}

const BUTTON_GUIDE_DATA: ButtonGuideItem[] = [
  // SECTION 1: BARRA SUPERIOR Y NAVEGACIÓN
  {
    id: "nav_tenant",
    category: "1. Navegación y Barra Superior",
    name: "Selector de Comercio (Multitenant)",
    iconName: "LayoutGrid",
    location: "Barra Superior (Izquierda)",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-slate-900",
      textClass: "text-white",
      borderClass: "border-slate-800",
      icon: LayoutGrid,
      label: "Tenant J&Z (Sucursal)"
    },
    summary: "Permite cambiar de sucursal o comercio activo de forma instantánea sin perder la sesión.",
    workflow: [
      "Paso 1: Haga clic sobre la tarjeta del comercio activo en el menú lateral o barra superior.",
      "Paso 2: Se desplegará la lista de tiendas asociadas (ej: 'Tenant J&Z' o 'Tenant Demo').",
      "Paso 3: Seleccione la tienda deseada. El sistema actualizará automáticamente el catálogo de productos, lista de clientes y facturación correspondiente a ese local."
    ],
    businessRules: "Mantiene la separación total de datos (Multitenant Aislado). Las ventas de una sucursal no afectan las estadísticas ni el stock de otra."
  },
  {
    id: "nav_menu",
    category: "1. Navegación y Barra Superior",
    name: "Botones del Menú de Navegación",
    iconName: "BookOpen",
    location: "Barra Lateral / Menú Principal",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-indigo-50",
      textClass: "text-indigo-700",
      borderClass: "border-indigo-200",
      icon: BookOpen,
      label: "Inicio | Productos | Clientes | POS | Historial"
    },
    summary: "Navega directamente entre los distintos módulos funcionales de la plataforma comercial.",
    workflow: [
      "Paso 1: Haga clic sobre cualquiera de las pestañas del menú lateral.",
      "Paso 2: La vista cambiará inmediatamente mostrando el módulo seleccionado (ej: Inicio, Productos, Clientes, POS o Historial).",
      "Paso 3: La pestaña activa se resaltará con fondo violeta o índigo para indicar su posición actual."
    ],
    businessRules: "Disponible para todos los operadores. Si se activa el rol 'Vendedor', las opciones de edición o eliminación avanzada en los módulos estarán protegidas."
  },
  {
    id: "nav_clock_logs",
    category: "1. Navegación y Barra Superior",
    name: "Reloj de Auditoría e Ingresos de Personal",
    iconName: "Clock",
    location: "Barra Superior (Zona Central)",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-indigo-50/80",
      textClass: "text-indigo-800",
      borderClass: "border-indigo-200",
      icon: Clock,
      label: "14:35 hs (Ver Accesos)"
    },
    summary: "Muestra la hora oficial del sistema y abre el registro auditable de inicios de sesión del personal.",
    workflow: [
      "Paso 1: Haga clic sobre el recuadro del reloj ubicado en la barra superior.",
      "Paso 2: Se abrirá una ventana emergente (modal) con la lista de ingresos recientes.",
      "Paso 3: Verifique el nombre del usuario, la fecha, hora exacta y el rol utilizado en el inicio de sesión."
    ],
    businessRules: "Garantiza trazabilidad y seguridad en caso de discrepancias de caja o anulaciones de ventas."
  },
  {
    id: "nav_user_profile",
    category: "1. Navegación y Barra Superior",
    name: "Perfil de Usuario Activo y Avatar",
    iconName: "UserCheck",
    location: "Barra Superior (Derecha)",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-white",
      textClass: "text-slate-800",
      borderClass: "border-slate-200",
      icon: UserCheck,
      label: "Juan Pérez (Administrador)"
    },
    summary: "Acceso al panel de personalización del perfil, cambio de rol o actualización de foto de perfil.",
    workflow: [
      "Paso 1: Haga clic sobre la tarjeta de usuario con su nombre y avatar.",
      "Paso 2: En la ventana modal, podrá cambiar entre los roles de 'Administrador' y 'Vendedor'.",
      "Paso 3: Para cambiar su foto, haga clic en la cámara, suba un archivo de imagen o pegue una URL pública."
    ],
    businessRules: "Las fotos de perfil se optimizan y comprimen de manera automática para garantizar un rendimiento ultrarrápido."
  },
  {
    id: "nav_logout",
    category: "1. Navegación y Barra Superior",
    name: "Botón Cerrar Sesión (Power Logout)",
    iconName: "LogOut",
    location: "Barra Superior (Extremo Derecho)",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-rose-50",
      textClass: "text-rose-600",
      borderClass: "border-rose-200",
      icon: LogOut,
      label: "Salir"
    },
    summary: "Cierra la sesión activa de manera segura y limpia el estado del navegador.",
    workflow: [
      "Paso 1: Haga clic en el botón con el ícono de apagado o salida.",
      "Paso 2: El sistema guardará el registro de salida y volverá a la pantalla de Login.",
      "Paso 3: Se requerirá seleccionar usuario y contraseña para volver a ingresar."
    ],
    businessRules: "Evita que personal no autorizado realice ventas con el perfil de otro usuario al alejarse del mostrador."
  },

  // SECTION 2: PANEL PRINCIPAL (DASHBOARD)
  {
    id: "dash_new_sale",
    category: "2. Panel Principal (Dashboard)",
    name: "Botón 'Registrar Nueva Venta' (POS)",
    iconName: "ShoppingBag",
    location: "Encabezado del Dashboard y Menú Lateral",
    role: "Vendedor / Administrador",
    visualBadge: {
      bgClass: "bg-indigo-600",
      textClass: "text-white",
      borderClass: "border-indigo-600",
      icon: ShoppingBag,
      label: "Registrar Nueva Venta"
    },
    summary: "Inicia de inmediato el módulo de cobro y punto de venta para atender al cliente en mostrador.",
    workflow: [
      "Paso 1: Presione el botón 'Registrar Nueva Venta' en el panel de bienvenida.",
      "Paso 2: La pantalla cambiará al Punto de Venta (POS) con el buscador de productos activo.",
      "Paso 3: Seleccione las prendas o calzados elegidos por el cliente y confirme el método de pago."
    ],
    businessRules: "Diseñado para operar con alta velocidad en cajas registradoras y pantallas táctiles."
  },
  {
    id: "dash_card_products",
    category: "2. Panel Principal (Dashboard)",
    name: "Tarjeta KPI 'Catálogo de Productos'",
    iconName: "Package",
    location: "Panel Resumen del Dashboard",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-blue-50",
      textClass: "text-blue-700",
      borderClass: "border-blue-200",
      icon: Package,
      label: "Productos: 148 ítems"
    },
    summary: "Muestra el total de prendas y calzados cargados y redirige al inventario.",
    workflow: [
      "Paso 1: Haga clic sobre la tarjeta interactiva de Productos en el Dashboard.",
      "Paso 2: Accederá a la lista completa de artículos con precios, costo y stock disponible."
    ],
    businessRules: "Actualiza los números de manera instantánea tras cada venta o modificación de mercadería."
  },
  {
    id: "dash_card_customers",
    category: "2. Panel Principal (Dashboard)",
    name: "Tarjeta KPI 'Clientes y Cuentas Corrientes'",
    iconName: "Users",
    location: "Panel Resumen del Dashboard",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-emerald-50",
      textClass: "text-emerald-700",
      borderClass: "border-emerald-200",
      icon: Users,
      label: "Clientes: 24 (Deudas: $185,000)"
    },
    summary: "Indica el número de clientes registrados y el monto total pendiente en cuentas corrientes.",
    workflow: [
      "Paso 1: Haga clic sobre la tarjeta de Clientes en el Dashboard.",
      "Paso 2: Accederá a las fichas individuales para registrar pagos parciales o consultar fiados."
    ],
    businessRules: "Resalta en color rojo si existen saldos adeudados vencidos o pendientes de pago."
  },
  {
    id: "dash_card_history",
    category: "2. Panel Principal (Dashboard)",
    name: "Tarjeta KPI 'Historial de Transacciones'",
    iconName: "History",
    location: "Panel Resumen del Dashboard",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-amber-50",
      textClass: "text-amber-700",
      borderClass: "border-amber-200",
      icon: History,
      label: "Recaudación Total: $1,250,000"
    },
    summary: "Muestra la facturación total acumulada y el historial de tickets emitidos.",
    workflow: [
      "Paso 1: Presione la tarjeta de Historial.",
      "Paso 2: Consulte el detalle de ventas por fecha, medio de pago, cliente y vendedor."
    ],
    businessRules: "Solo los Administradores tienen permiso para anular tickets registrados en el historial."
  },

  // SECTION 3: PRODUCTOS E INVENTARIO
  {
    id: "prod_add_btn",
    category: "3. Productos e Inventario",
    name: "Botón '+ Nuevo Producto'",
    iconName: "PlusCircle",
    location: "Encabezado de la vista Productos",
    role: "Administrador",
    visualBadge: {
      bgClass: "bg-indigo-600",
      textClass: "text-white",
      borderClass: "border-indigo-600",
      icon: PlusCircle,
      label: "+ Nuevo Producto"
    },
    summary: "Despliega el formulario para dar de alta una nueva prenda o calzado en el catálogo.",
    workflow: [
      "Paso 1: Presione el botón '+ Nuevo Producto'.",
      "Paso 2: Ingrese el Nombre (ej. 'Zapatilla Deportiva J&Z'), Categoría ('Ropa', 'Calzado', 'Accesorios'), Precio de Venta y Costo.",
      "Paso 3: Defina la Cantidad en Stock inicial y el Límite de Stock Mínimo para alertas.",
      "Paso 4: Haga clic en 'Guardar Producto' para confirmar."
    ],
    businessRules: "Calcula el porcentaje de margen de ganancia automáticamente basado en el precio y el costo ingresados."
  },
  {
    id: "prod_shoe_size_guide",
    category: "3. Productos e Inventario",
    name: "Procedimiento: Carga de Calzado por Talle / Numeración",
    iconName: "Package",
    location: "Modal de Alta de Producto",
    role: "Administrador",
    visualBadge: {
      bgClass: "bg-purple-50",
      textClass: "text-purple-700",
      borderClass: "border-purple-200",
      icon: Package,
      label: "Calzado por Talle (N° 38, N° 39...)"
    },
    summary: "Instrucciones de registro para mantener un control exacto de stock por número de talle.",
    workflow: [
      "Paso 1: Al crear un calzado, agregue la numeración específica en el Nombre (ej: 'Zapatilla J&Z - N° 38').",
      "Paso 2: Seleccione la categoría 'Calzado'.",
      "Paso 3: Asigne el stock físico correspondiente a ese número específico.",
      "Paso 4: Repita el procedimiento para cada talle recibido (N° 39, N° 40, etc.)."
    ],
    businessRules: "Garantiza que al vender un talle en el POS, sólo se descuente la unidad del número vendido y no de otras tallas."
  },
  {
    id: "prod_edit_btn",
    category: "3. Productos e Inventario",
    name: "Botón 'Editar Producto' (Ícono Lápiz)",
    iconName: "Edit3",
    location: "Fila del Producto (Columna Acciones)",
    role: "Administrador",
    visualBadge: {
      bgClass: "bg-slate-100",
      textClass: "text-slate-700",
      borderClass: "border-slate-300",
      icon: Edit3,
      label: "Editar"
    },
    summary: "Abre el formulario de edición para actualizar precios, costos o ajustar stock.",
    workflow: [
      "Paso 1: Localice el artículo en la tabla y presione el ícono de Lápiz.",
      "Paso 2: Modifique los valores requeridos (ej. actualización por inflación de precios).",
      "Paso 3: Presione 'Guardar Cambios' para impactar en la base de datos."
    ],
    businessRules: "El cambio de precio no altera los montos de ventas pasadas ya registradas en el historial."
  },
  {
    id: "prod_delete_btn",
    category: "3. Productos e Inventario",
    name: "Botón 'Eliminar Producto' (Papelera Roja)",
    iconName: "Trash2",
    location: "Fila del Producto (Columna Acciones)",
    role: "Administrador",
    visualBadge: {
      bgClass: "bg-rose-50",
      textClass: "text-rose-600",
      borderClass: "border-rose-200",
      icon: Trash2,
      label: "Eliminar"
    },
    summary: "Remueve en forma permanente el artículo del catálogo de ventas.",
    workflow: [
      "Paso 1: Presione el ícono de Papelera en la fila del artículo.",
      "Paso 2: Confirme la acción en el cuadro emergente de seguridad.",
      "Paso 3: El artículo se borrará del catálogo."
    ],
    businessRules: "Solo disponible para el rol Administrador. Requiere confirmación obligatoria para evitar borrados accidentales."
  },

  // SECTION 4: CLIENTES Y CUENTAS CORRIENTES
  {
    id: "cust_add_btn",
    category: "4. Clientes y Cuentas Corrientes",
    name: "Botón '+ Nuevo Cliente'",
    iconName: "PlusCircle",
    location: "Encabezado de la vista Clientes",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-indigo-600",
      textClass: "text-white",
      borderClass: "border-indigo-600",
      icon: PlusCircle,
      label: "+ Nuevo Cliente"
    },
    summary: "Abre la ventana para dar de alta un cliente en la base de datos.",
    workflow: [
      "Paso 1: Presione '+ Nuevo Cliente'.",
      "Paso 2: Ingrese Nombre Completo, Teléfono de contacto, Correo electrónico y Dirección.",
      "Paso 3: Haga clic en 'Guardar Cliente'. La ficha iniciará con un saldo inicial de $0."
    ],
    businessRules: "Permite asociar ventas a crédito o plazo en el módulo de Punto de Venta."
  },
  {
    id: "cust_pay_debt_btn",
    category: "4. Clientes y Cuentas Corrientes",
    name: "Botón 'Abonar / Cobrar Deuda' (Billetera / Dólar)",
    iconName: "DollarSign",
    location: "Tarjeta de Cliente con Saldo Pendiente",
    role: "Administrador / Vendedor",
    visualBadge: {
      bgClass: "bg-emerald-600",
      textClass: "text-white",
      borderClass: "border-emerald-600",
      icon: DollarSign,
      label: "Abonar Deuda"
    },
    summary: "Registra cobros parciales o totales de clientes que compraron a cuenta corriente.",
    workflow: [
      "Paso 1: Busque al cliente deudor y haga clic en 'Abonar Deuda'.",
      "Paso 2: Ingrese el monto entregado en efectivo, transferencia o débito por el cliente.",
      "Paso 3: Haga clic en 'Confirmar Pago'. El sistema reducirá la deuda inmediatamente.",
      "Paso 4: Los artículos adeudados más antiguos se irán marcando como saldados (sistema FIFO)."
    ],
    businessRules: "Si el pago cubre el total adeudado, la ficha del cliente volverá automáticamente a estado $0 (Al día)."
  },
  {
    id: "cust_view_items_btn",
    category: "4. Clientes y Cuentas Corrientes",
    name: "Botón 'Ver Artículos Adeudados' (Ícono Ojo)",
    iconName: "Eye",
    location: "Tarjeta de Cliente en Cuenta Corriente",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-slate-100",
      textClass: "text-slate-700",
      borderClass: "border-slate-300",
      icon: Eye,
      label: "Ver Prendas Fiadas"
    },
    summary: "Muestra el detalle exacto de las prendas o zapatos que el cliente fió.",
    workflow: [
      "Paso 1: Presione el botón con forma de Ojo en la ficha del cliente.",
      "Paso 2: Se abrirá una tabla listando cada producto adeudado, cantidad, fecha de compra y si está saldado o pendiente."
    ],
    businessRules: "Permite transparentar el resumen de cuenta ante reclamos o dudas de los clientes."
  },

  // SECTION 5: PUNTO DE VENTA (POS)
  {
    id: "pos_add_to_cart",
    category: "5. Punto de Venta (POS)",
    name: "Botón '+ Agregar al Carrito'",
    iconName: "Plus",
    location: "En cada tarjeta de producto del POS",
    role: "Vendedor / Administrador",
    visualBadge: {
      bgClass: "bg-indigo-50 hover:bg-indigo-100",
      textClass: "text-indigo-700",
      borderClass: "border-indigo-200",
      icon: Plus,
      label: "+ Agregar al Carrito"
    },
    summary: "Suma una unidad de la prenda o calzado seleccionado al ticket de venta actual.",
    workflow: [
      "Paso 1: En la parrilla de productos del POS, busque el artículo.",
      "Paso 2: Presione '+ Agregar al Carrito'.",
      "Paso 3: El artículo se agregará a la lista del ticket en el panel derecho."
    ],
    businessRules: "Si el producto se queda sin stock disponible, el botón se desactivará automáticamente para prevenir sobreventas."
  },
  {
    id: "pos_qty_plus_minus",
    category: "5. Punto de Venta (POS)",
    name: "Controles (+ / -) de Cantidad en Carrito",
    iconName: "Plus",
    location: "Fila del Producto dentro del Carrito",
    role: "Vendedor / Administrador",
    visualBadge: {
      bgClass: "bg-slate-100",
      textClass: "text-slate-800",
      borderClass: "border-slate-300",
      icon: Plus,
      label: "[-] 2 unidades [+]"
    },
    summary: "Modifica rápidamente la cantidad de unidades que el cliente va a llevar.",
    workflow: [
      "Paso 1: Presione [+] para sumar una unidad o [-] para restar.",
      "Paso 2: El subtotal del producto y el total del ticket se recalcularán al instante."
    ],
    businessRules: "No permite superar el stock físico disponible en el depósito."
  },
  {
    id: "pos_payment_methods",
    category: "5. Punto de Venta (POS)",
    name: "Botones de Selección de Medio de Pago",
    iconName: "DollarSign",
    location: "Panel de Cobro en POS",
    role: "Vendedor / Administrador",
    visualBadge: {
      bgClass: "bg-slate-900",
      textClass: "text-white",
      borderClass: "border-slate-800",
      icon: DollarSign,
      label: "Efectivo | Transferencia | Débito | Crédito | Cuenta Corriente"
    },
    summary: "Define cómo abonará la compra el cliente.",
    workflow: [
      "Paso 1: En el resumen del ticket, haga clic en la forma de pago deseada.",
      "Paso 2: Si elige 'Cuenta Corriente', asegúrese de haber seleccionado previamente el cliente deudor en el buscador superior."
    ],
    businessRules: "La opción 'Cuenta Corriente' requiere obligatoriamente asociar un cliente registrado."
  },
  {
    id: "pos_confirm_sale",
    category: "5. Punto de Venta (POS)",
    name: "Botón 'Confirmar y Registrar Venta'",
    iconName: "CheckCircle2",
    location: "Pie del Panel de Cobro POS",
    role: "Vendedor / Administrador",
    visualBadge: {
      bgClass: "bg-emerald-600",
      textClass: "text-white",
      borderClass: "border-emerald-600",
      icon: CheckCircle2,
      label: "Confirmar y Registrar Venta"
    },
    summary: "Finaliza la transacción, descuenta stock y emite el comprobante.",
    workflow: [
      "Paso 1: Revise el total y los artículos del carrito.",
      "Paso 2: Presione 'Confirmar y Registrar Venta'.",
      "Paso 3: El sistema descontará las unidades vendidas del catálogo, registrará el ticket en el historial y mostrará el comprobante imprimible."
    ],
    businessRules: "Acción irrevocable directa. En caso de error, el Administrador deberá anular la venta desde el Historial."
  },

  // SECTION 6: HISTORIAL Y ANULACIONES
  {
    id: "hist_view_receipt",
    category: "6. Historial de Ventas y Auditoría",
    name: "Botón 'Ver Comprobante / Ticket' (Ícono Ojo)",
    iconName: "Eye",
    location: "Tabla de Ventas (Columna Acciones)",
    role: "Todos los Usuarios",
    visualBadge: {
      bgClass: "bg-indigo-50",
      textClass: "text-indigo-700",
      borderClass: "border-indigo-200",
      icon: Eye,
      label: "Ver Ticket"
    },
    summary: "Reabre la ventana con la boleta o comprobante oficial de la venta realizada.",
    workflow: [
      "Paso 1: Busque la venta en la lista por fecha o cliente.",
      "Paso 2: Presione 'Ver Ticket'.",
      "Paso 3: Podrá imprimir el ticket o enviarlo digitalmente al cliente."
    ],
    businessRules: "Muestra el nombre del vendedor que registró la transacción y la hora exacta."
  },
  {
    id: "hist_annul_sale",
    category: "6. Historial de Ventas y Auditoría",
    name: "Botón 'Anular Venta / Reintegrar Stock' (Papelera Roja)",
    iconName: "Trash2",
    location: "Tabla de Ventas (Columna Acciones)",
    role: "Administrador",
    visualBadge: {
      bgClass: "bg-rose-50",
      textClass: "text-rose-600",
      borderClass: "border-rose-200",
      icon: Trash2,
      label: "Anular Venta"
    },
    summary: "Anula la transacción y reingresa automáticamente las prendas o calzados devueltos al inventario.",
    workflow: [
      "Paso 1: Ubique la venta a cancelar y presione la papelera roja.",
      "Paso 2: Confirme la anulación.",
      "Paso 3: El sistema devolverá las unidades de stock al catálogo y restará el monto de la facturación diaria."
    ],
    businessRules: "Privilegio exclusivo de Administradores para resguardar la caja y el stock de la sucursal."
  }
];

export default function UserManual() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeGuideStep, setActiveGuideStep] = useState<string | null>(null);

  const categories = [
    "Todos",
    "1. Navegación y Barra Superior",
    "2. Panel Principal (Dashboard)",
    "3. Productos e Inventario",
    "4. Clientes y Cuentas Corrientes",
    "5. Punto de Venta (POS)",
    "6. Historial de Ventas y Auditoría"
  ];

  const filteredButtons = BUTTON_GUIDE_DATA.filter(btn => {
    const matchesSearch = btn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          btn.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          btn.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          btn.workflow.some(w => w.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "Todos" || btn.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    // PAGE 1: COVER & HEADER
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 44, "F");

    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 44, 210, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("MANUAL DE USUARIO EXPLICATIVO Y GUÍA DE BOTONES", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text("Plataforma SaaS Multitenant J&Z - Control Comercial, Stock y Cuentas Corrientes", 14, 27);
    doc.text(`Documento Oficial Ilustrado para Usuario Final | Emitido: ${dateStr} hs (ART)`, 14, 35);

    // Summary Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, 53, 182, 38, 3, 3, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Guía Operativa de Interfaz y Funcionamiento de Botones", 18, 62);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("• Este documento contiene la explicación paso a paso de cada botón y control del sistema.", 18, 70);
    doc.text("• Incluye recomendaciones operativas para carga de calzados por numeración/talle,", 18, 76);
    doc.text("  cobro de cuentas corrientes en fiados, punto de venta e historial auditable.", 18, 82);

    // Section 1: Introduction
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("1. CATÁLOGO Y DETALLE FUNCIONAL DE BOTONES", 14, 102);

    // Table Data preparation
    const tableBody = BUTTON_GUIDE_DATA.map(btn => [
      btn.category.replace(/^\d+\.\s*/, ""),
      `${btn.name}\n[Ubicación: ${btn.location}]`,
      btn.role,
      btn.summary,
      btn.workflow.join("\n")
    ]);

    autoTable(doc, {
      startY: 108,
      head: [["Módulo", "Nombre del Botón / Ubicación", "Rol Acceso", "Descripción de la Función", "Procedimiento Paso a Paso"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold"
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 38, fontStyle: "bold" },
        2: { cellWidth: 22 },
        3: { cellWidth: 42 },
        4: { cellWidth: 54 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer on each page
        const pageCount = doc.getNumberOfPages();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 285, 210, 12, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Plataforma Comercial J&Z - Manual de Usuario Final Ilustrado", 14, 292);
        doc.text(`Página ${data.pageNumber} de ${pageCount}`, 180, 292);
      }
    });

    // Save PDF
    doc.save("Manual_de_Usuario_Guia_Explicativa_Botones_JZ.pdf");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Documento Oficial de Capacitación para Usuario Final</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight">
              Manual de Usuario & Guía Ilustrada de Botones
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consulte la imagen visual exacta, ubicación, rol permitido y procedimiento paso a paso de cada botón del sistema. Descargue el documento PDF oficial para su equipo comercial.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Manual PDF</span>
          </button>
        </div>
      </div>

      {/* Quick Visual Workflows Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span>Guías Frecuentes de Operación Comercial</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instrucciones clave para la atención diaria en el local.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              <span>Carga de Calzado por Talle</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Al cargar calzados, registre un producto individual indicando la numeración en el nombre (ej: <span className="font-semibold text-slate-900">"Zapatilla J&Z - N° 39"</span>). Esto evita vender números agotados.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
              <span>Cobro de Cuentas Corrientes</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vaya al módulo <span className="font-semibold text-slate-900">Clientes</span>, ubique al deudor y presione el botón verde <span className="font-semibold text-emerald-700">Abonar Deuda</span>. Ingrese el dinero entregado; los ítems fiados se saldarán en orden FIFO.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
              <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
              <span>Venta Rápida en Caja (POS)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              En el módulo <span className="font-semibold text-slate-900">Punto de Venta</span>, haga clic en <span className="font-semibold text-indigo-600">+ Agregar al Carrito</span>, elija la forma de pago y presione <span className="font-semibold text-emerald-700">Confirmar Venta</span> para emitir ticket y descontar stock.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar un botón por nombre, ícono o función..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-900">{filteredButtons.length}</span> botones documentados
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons List Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredButtons.map((btn) => {
          const BadgeIcon = btn.visualBadge.icon;
          return (
            <div 
              key={btn.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-indigo-200 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Badge & Category */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                    {btn.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    Rol: {btn.role}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-black text-slate-900 font-display">
                  {btn.name}
                </h3>

                {/* VISUAL REPRESENTATION OF THE BUTTON */}
                <div className="p-3 bg-slate-900/5 rounded-2xl border border-slate-200/60 space-y-1.5">
                  <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    Apariencia Real en Pantalla
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs ${btn.visualBadge.bgClass} ${btn.visualBadge.textClass} ${btn.visualBadge.borderClass}`}>
                      <BadgeIcon className="h-4 w-4" />
                      <span>{btn.visualBadge.label}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                  <span className="text-slate-400">Ubicación exacto:</span>
                  <span className="text-slate-800 font-semibold">{btn.location}</span>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {btn.summary}
                </p>

                {/* Step by Step Workflow */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-900 flex items-center space-x-1">
                    <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Procedimiento Paso a Paso:</span>
                  </div>
                  <ul className="space-y-1 pl-2">
                    {btn.workflow.map((step, idx) => (
                      <li key={idx} className="text-[11px] text-slate-600 leading-relaxed flex items-start space-x-1.5">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Business rules callout */}
                <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Regla de Negocio / Permisos:</span> {btn.businessRules}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredButtons.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron botones</h4>
            <p className="text-xs text-slate-400">Pruebe ajustando el término de búsqueda o cambiando la categoría seleccionada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
