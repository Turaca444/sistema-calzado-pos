import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DBState, Product, Customer, Sale, SaleItem, UnpaidItem, Tenant, User, UserRole, LoginLog, DailyClosing } from "./src/types";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data.json");

// Parse JSON and URL encoded bodies with high payload limits for Base64 profile photos and images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==================== API SECURITY SHIELD & HARDENING ====================

interface SecurityLog {
  id: string;
  timestamp: string;
  ip: string;
  path: string;
  method: string;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  details: string;
}

const securityAuditLogs: SecurityLog[] = [];
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const lockoutMap = new Map<string, { failedCount: number; lockedUntil: number }>();
let totalBlockedAttacks = 0;

function logSecurityEvent(
  ip: string,
  path: string,
  method: string,
  eventType: string,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  details: string
) {
  totalBlockedAttacks++;
  const event: SecurityLog = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    ip,
    path,
    method,
    eventType,
    severity,
    details
  };
  securityAuditLogs.unshift(event);
  if (securityAuditLogs.length > 200) securityAuditLogs.pop();
  console.warn(`[SECURITY SHIELD] [${severity}] ${eventType}: ${details} (IP: ${ip})`);
}

// 1. Bank-Grade HTTP Security Headers
app.use((_req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// 2. DDoS & Rate Limiting Guard per IP
app.use("/api", (req, res, next) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  const now = Date.now();

  // Check if IP is currently locked out due to attack attempts
  const lockout = lockoutMap.get(clientIp);
  if (lockout && lockout.lockedUntil > now) {
    const remainingSec = Math.ceil((lockout.lockedUntil - now) / 1000);
    logSecurityEvent(clientIp, req.path, req.method, "BLOCKED_LOCKED_OUT_IP", "HIGH", `Intento de solicitud desde IP bloqueada por seguridad. Tiempo restante: ${remainingSec}s`);
    return res.status(429).json({
      error: `🔒 Acceso Bloqueado por Seguridad: Múltiples intentos o ataques detectados. Por favor intente nuevamente en ${remainingSec} segundos.`
    });
  }

  // Rate Limiter: max 300 requests per 60s per IP
  const windowMs = 60 * 1000;
  const maxRequests = 300;
  const clientRate = rateLimitMap.get(clientIp) || { count: 0, resetTime: now + windowMs };

  if (now > clientRate.resetTime) {
    clientRate.count = 1;
    clientRate.resetTime = now + windowMs;
  } else {
    clientRate.count++;
  }
  rateLimitMap.set(clientIp, clientRate);

  if (clientRate.count > maxRequests) {
    logSecurityEvent(clientIp, req.path, req.method, "RATE_LIMIT_EXCEEDED", "MEDIUM", `Exceso de tasa de solicitudes (${clientRate.count}/${maxRequests} por min)`);
    return res.status(429).json({
      error: "⚠️ Demasiadas solicitudes enviadas. Límite de tasa excedido para prevenir ataques de denegación de servicio (DDoS)."
    });
  }

  next();
});

// 3. Payload Scanner Middleware (Anti-XSS, Anti-SQL Injection, Prototype Pollution Guard)
function containsMaliciousPayload(str: string): { detected: boolean; reason?: string } {
  if (!str || typeof str !== "string") return { detected: false };
  const lower = str.toLowerCase();
  
  if (lower.includes("<script") || lower.includes("javascript:") || lower.includes("onerror=") || lower.includes("onload=") || lower.includes("<iframe")) {
    return { detected: true, reason: "Inyección de Script Malicioso (XSS) detectada" };
  }
  if (
    lower.includes("union select") ||
    lower.includes("drop table") ||
    lower.includes("truncate table") ||
    lower.includes("delete from") ||
    lower.includes("exec(") ||
    lower.includes(";--")
  ) {
    return { detected: true, reason: "Inyección SQL/Comandos detectada" };
  }
  return { detected: false };
}

function scanObject(obj: any): { detected: boolean; reason?: string } {
  if (!obj) return { detected: false };
  if (typeof obj === "string") return containsMaliciousPayload(obj);
  if (typeof obj === "object") {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          return { detected: true, reason: "Intento de Contaminación de Prototipos (Prototype Pollution)" };
        }
        // Skip base64 photo data strings from scanning to avoid false positives on standard image tokens
        if (key === "avatar" || key === "avatarUrl" || key === "photoUrl" || key === "image") {
          continue;
        }
        const result = scanObject(obj[key]);
        if (result.detected) return result;
      }
    }
  }
  return { detected: false };
}

app.use("/api", (req, res, next) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";

  const bodyCheck = scanObject(req.body);
  const queryCheck = scanObject(req.query);

  if (bodyCheck.detected || queryCheck.detected) {
    const reason = bodyCheck.reason || queryCheck.reason || "Patrón malicioso";

    // Record attack attempt and increment lockout counter
    const lockout = lockoutMap.get(clientIp) || { failedCount: 0, lockedUntil: 0 };
    lockout.failedCount++;
    if (lockout.failedCount >= 5) {
      lockout.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
    }
    lockoutMap.set(clientIp, lockout);

    logSecurityEvent(clientIp, req.path, req.method, "CRITICAL_ATTACK_BLOCKED", "CRITICAL", `Ataque bloqueado: ${reason}`);
    return res.status(403).json({
      error: `🚨 ESCUDO DE SEGURIDAD API: Solicitud rechazada por detectar ${reason}.`
    });
  }

  next();
});

// Initial seed data for SaaS multi-tenant
const initialData: DBState = {
  tenants: [
    {
      id: "tenant_jz",
      name: "JM Software",
      plan: "Plan Pro",
      status: "active",
      paymentGateway: "stripe",
      monthlyPrice: 35000,
      nextBillingDate: "2026-08-15"
    },
    {
      id: "tenant_elsol",
      name: "Calzados El Sol",
      plan: "Plan Premium",
      status: "active",
      paymentGateway: "mercado_pago",
      monthlyPrice: 25000,
      nextBillingDate: "2026-08-10"
    },
    {
      id: "tenant_modaexpress",
      name: "Accesorios ModaExpress",
      plan: "Plan Básico",
      status: "suspended",
      paymentGateway: "mercado_pago",
      monthlyPrice: 15000,
      nextBillingDate: "2026-07-01"
    }
  ],
  users: [
    {
      id: "user_jz_admin",
      name: "Admin J&Z",
      email: "turacam2014@gmail.com",
      role: "administrador",
      tenantId: "tenant_jz",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "user_jz_vendedor",
      name: "Sofía Vendedora",
      email: "sofia.vende@jz.com",
      role: "vendedor",
      tenantId: "tenant_jz",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "user_elsol_admin",
      name: "Carlos Admin",
      email: "carlos@elsol.com",
      role: "administrador",
      tenantId: "tenant_elsol",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "user_elsol_vendedor",
      name: "Pedro Vendedor",
      email: "pedro@elsol.com",
      role: "vendedor",
      tenantId: "tenant_elsol",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "user_moda_admin",
      name: "Ana Admin",
      email: "ana@moda.com",
      role: "administrador",
      tenantId: "tenant_modaexpress",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
    }
  ],
  products: [],
  customers: [
    {
      id: "cust_anonymous_jz",
      tenantId: "tenant_jz",
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "cust_anonymous_elsol",
      tenantId: "tenant_elsol",
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "cust_anonymous_modaexpress",
      tenantId: "tenant_modaexpress",
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: "2026-01-01T00:00:00.000Z"
    }
  ],
  sales: []
};

// Helper to read database
function readDB(): DBState {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    
    // Schema Upgrade check for Multi-Tenant SaaS
    if (!parsed.tenants || parsed.tenants.length === 0) {
      console.log("[SaaS Upgrade] Migrando base de datos local para soporte multi-inquilino...");
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }

    // Automatically migrate old default tenant name "J&Z Indumentaria" to "JM Software"
    let updated = false;
    parsed.tenants = parsed.tenants.map((t: Tenant) => {
      if (t.id === "tenant_jz" && t.name === "J&Z Indumentaria") {
        updated = true;
        return { ...t, name: "JM Software" };
      }
      return t;
    });

    // Remove old seeded demo items if present
    const demoProdIds = ["prod_1", "prod_2", "prod_3", "prod_4", "prod_5", "prod_6", "prod_7", "prod_8", "prod_9"];
    if (parsed.products && parsed.products.some((p: any) => demoProdIds.includes(p.id))) {
      parsed.products = parsed.products.filter((p: any) => !demoProdIds.includes(p.id));
      updated = true;
    }
    const demoCustIds = ["cust_1_jz", "cust_2_jz", "cust_1_elsol"];
    if (parsed.customers && parsed.customers.some((c: any) => demoCustIds.includes(c.id))) {
      parsed.customers = parsed.customers.filter((c: any) => !demoCustIds.includes(c.id));
      updated = true;
    }
    const demoSaleIds = ["sale_seeded_1", "sale_seeded_2", "sale_seeded_3"];
    if (parsed.sales && parsed.sales.some((s: any) => demoSaleIds.includes(s.id))) {
      parsed.sales = parsed.sales.filter((s: any) => !demoSaleIds.includes(s.id));
      updated = true;
    }

    // Ensure sales have progressive invoice numbers
    if (parsed.sales && Array.isArray(parsed.sales)) {
      // Group sales by tenantId to build progressive numbering per tenant
      const salesByTenant: Record<string, any[]> = {};
      parsed.sales.forEach((s: any) => {
        const tid = s.tenantId || "tenant_jz";
        if (!salesByTenant[tid]) salesByTenant[tid] = [];
        salesByTenant[tid].push(s);
      });

      // For each tenant, ensure all sales have invoiceSequence and invoiceNumber
      for (const tid in salesByTenant) {
        const tenantSales = salesByTenant[tid];
        // Sort sales chronologically by date
        tenantSales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        tenantSales.forEach((s, idx) => {
          if (!s.invoiceSequence || !s.invoiceNumber) {
            s.invoiceSequence = idx + 1;
            s.invoiceNumber = `FAC-${String(idx + 1).padStart(6, '0')}`;
            updated = true;
          }
        });
      }
    }

    // Ensure users have avatarUrl populated
    if (parsed.users && parsed.users.length > 0) {
      const defaultAvatars: Record<string, string> = {
        "user_jz_admin": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "user_jz_vendedor": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "user_elsol_admin": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "user_elsol_vendedor": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "user_moda_admin": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
      };
      let usersUpdated = false;
      parsed.users = parsed.users.map((u: User) => {
        if (!u.avatarUrl) {
          usersUpdated = true;
          const assigned = defaultAvatars[u.id] || (
            u.role === "administrador"
              ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
          );
          return { ...u, avatarUrl: assigned, photoUrl: assigned };
        }
        return u;
      });
      if (usersUpdated) {
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }
    // Ensure loginLogs exists
    if (!parsed.loginLogs) {
      parsed.loginLogs = [];
    }
    return parsed;
  } catch (error) {
    console.error("Error al leer la base de datos:", error);
    return initialData;
  }
}

// Helper to write database
function writeDB(data: DBState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error al escribir en la base de datos:", error);
  }
}

// ==================== SAAS MIDDLEWARE ====================

// Middleware to authorize and isolate tenant requests, and enforce subscription paywalls
app.use("/api", (req, res, next) => {
  // Allow system/tenant listing, billing simulator, security status, and toggle endpoints to execute freely
  if (req.path.startsWith("/tenants") || req.path.startsWith("/security")) {
    return next();
  }
  
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const db = readDB();
  const tenant = db.tenants.find(t => t.id === tenantId);
  
  if (!tenant) {
    return res.status(404).json({ error: `Comercio (Tenant) '${tenantId}' no registrado en el sistema SaaS.` });
  }

  // If subscription status is suspended, block access with 402 Payment Required!
  if (tenant.status === "suspended") {
    return res.status(402).json({
      error: `Acceso Bloqueado: La suscripción de '${tenant.name}' se encuentra suspendida por falta de pago.`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      plan: tenant.plan,
      monthlyPrice: tenant.monthlyPrice,
      paymentGateway: tenant.paymentGateway,
      suspended: true
    });
  }
  
  next();
});

// ==================== SECURITY SHIELD & MONITORING API ====================

// GET: Current API Security Shield metrics and audit logs
app.get("/api/security/status", (_req, res) => {
  const now = Date.now();
  const activeLockouts = Array.from(lockoutMap.entries()).filter(([_, val]) => val.lockedUntil > now).length;

  res.json({
    status: "ACTIVE_PROTECTION",
    shieldVersion: "v2.5 Enterprise Security Engine",
    activeShields: [
      "Protección DDoS y Límite de Tasa (300 req/min por IP)",
      "Bloqueo Automático Anti-Fuerza Bruta y Ataques Reincidentes",
      "Sanitización Anti-XSS y Anti-Inyección SQL/Comandos",
      "Encabezados HTTP de Grado Bancario (NOSNIFF, SAMEORIGIN, Anti-Clickjacking)",
      "Aislamiento Estricto Multi-Inquilino (Tenant Isolation Guard)",
      "Protección Contra Contaminación de Prototipos (Prototype Pollution Guard)"
    ],
    totalBlockedAttacks,
    activeLockoutsCount: activeLockouts,
    securityLogs: securityAuditLogs.slice(0, 50)
  });
});

// POST: Reset security lockouts & rate limits (Admin tool)
app.post("/api/security/clear-lockouts", (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  lockoutMap.clear();
  rateLimitMap.clear();
  logSecurityEvent(clientIp, "/api/security/clear-lockouts", "POST", "ADMIN_RESET_SECURITY", "LOW", "Reinicio manual de bloqueos de seguridad y límites de tasa");
  res.json({ message: "Escudo de seguridad reiniciado con éxito. Todos los bloqueos de IP y contadores han sido liberados." });
});

// ==================== TENANTS API (Billing, SaaS Management) ====================

// GET: List all tenants (used by tenant switcher and overview panels)
app.get("/api/tenants", (req, res) => {
  const db = readDB();
  res.json(db.tenants);
});

// PUT: Update Tenant Details (Allow changing commerce/store name, plan, etc.)
app.put("/api/tenants/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { name, plan, status, monthlyPrice } = req.body;

  const tIdx = db.tenants.findIndex(t => t.id === id);
  if (tIdx === -1) {
    return res.status(404).json({ error: "Comercio no encontrado" });
  }

  if (name !== undefined && typeof name === "string") {
    const trimmed = name.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "El nombre del comercio no puede estar vacío" });
    }
    db.tenants[tIdx].name = trimmed;
  }
  if (plan !== undefined) db.tenants[tIdx].plan = plan;
  if (status !== undefined) db.tenants[tIdx].status = status;
  if (monthlyPrice !== undefined) db.tenants[tIdx].monthlyPrice = Number(monthlyPrice);

  writeDB(db);
  res.json(db.tenants[tIdx]);
});

// POST: Toggle Tenant Status (Utility for live testing)
app.post("/api/tenants/:id/toggle-status", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const tIdx = db.tenants.findIndex(t => t.id === id);
  if (tIdx === -1) {
    return res.status(404).json({ error: "Comercio no encontrado" });
  }

  const currentStatus = db.tenants[tIdx].status;
  db.tenants[tIdx].status = currentStatus === "active" ? "suspended" : "active";
  if (db.tenants[tIdx].status === "active") {
    db.tenants[tIdx].nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  }
  
  writeDB(db);
  res.json({
    message: `Estado de '${db.tenants[tIdx].name}' cambiado a '${db.tenants[tIdx].status}' con éxito.`,
    tenant: db.tenants[tIdx]
  });
});

// POST: Simulate Payment via Mercado Pago or Stripe (Auto-unlocks tenant)
app.post("/api/tenants/:id/pay", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { cardName, cardNumber, gateway } = req.body;

  const tIdx = db.tenants.findIndex(t => t.id === id);
  if (tIdx === -1) {
    return res.status(404).json({ error: "Comercio no encontrado" });
  }

  // Update tenant status to active
  db.tenants[tIdx].status = "active";
  db.tenants[tIdx].nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  if (gateway) {
    db.tenants[tIdx].paymentGateway = gateway;
  }

  writeDB(db);
  res.json({
    message: `¡Pago de suscripción procesado correctamente! Licencia reactivada para '${db.tenants[tIdx].name}'.`,
    tenant: db.tenants[tIdx],
    transactionId: `tx_${Date.now()}`,
    amount: db.tenants[tIdx].monthlyPrice
  });
});

// ==================== PRODUCTS API (Tenant Isolated) ====================

// GET: All Products (Filtered by Tenant)
app.get("/api/products", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const filtered = db.products.filter(p => p.tenantId === tenantId);
  res.json(filtered);
});

// POST: Create Product (Scoped to Tenant)
app.post("/api/products", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { name, category, price, cost, stock, minStock } = req.body;

  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "Faltan campos obligatorios (nombre, categoría, precio, stock)" });
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    tenantId,
    name,
    category,
    price: Number(price),
    cost: cost !== undefined ? Number(cost) : Math.round(Number(price) * 0.5),
    stock: Number(stock),
    minStock: minStock !== undefined ? Number(minStock) : 5
  };

  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

// PUT: Update Product (Scoped to Tenant)
app.put("/api/products/:id", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;
  const { name, category, price, cost, stock, minStock } = req.body;

  const prodIdx = db.products.findIndex(p => p.id === id && p.tenantId === tenantId);
  if (prodIdx === -1) {
    return res.status(404).json({ error: "Producto no encontrado o no pertenece a su comercio" });
  }

  const updatedProduct = {
    ...db.products[prodIdx],
    ...(name !== undefined && { name }),
    ...(category !== undefined && { category }),
    ...(price !== undefined && { price: Number(price) }),
    ...(cost !== undefined && { cost: Number(cost) }),
    ...(stock !== undefined && { stock: Number(stock) }),
    ...(minStock !== undefined && { minStock: Number(minStock) })
  };

  db.products[prodIdx] = updatedProduct;
  writeDB(db);
  res.json(updatedProduct);
});

// DELETE: Delete Product (Role and Tenant Scoped)
app.delete("/api/products/:id", (req, res) => {
  const userRole = (req.headers["x-user-role"] as string) || "administrador";
  if (userRole === "vendedor") {
    return res.status(403).json({ error: "Permisos Insuficientes: El rol 'Vendedor' no tiene permisos para eliminar artículos. Requiere rol de 'Administrador'." });
  }

  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;

  const prodIdx = db.products.findIndex(p => p.id === id && p.tenantId === tenantId);
  if (prodIdx === -1) {
    return res.status(404).json({ error: "Producto no encontrado o no pertenece a su comercio" });
  }

  db.products.splice(prodIdx, 1);
  writeDB(db);
  res.json({ message: "Producto eliminado con éxito", id });
});

// ==================== CUSTOMERS API (Tenant Isolated) ====================

// GET: All Customers (Filtered by Tenant)
app.get("/api/customers", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  let filtered = db.customers.filter(c => c.tenantId === tenantId);

  // Auto-provision Consumidor Final if missing for this tenant
  const hasAnon = filtered.some(c => c.id.startsWith("cust_anonymous") || c.name.toLowerCase() === "consumidor final");
  if (!hasAnon) {
    const newAnon: Customer = {
      id: `cust_anonymous_${tenantId}`,
      tenantId,
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: new Date().toISOString()
    };
    db.customers.unshift(newAnon);
    writeDB(db);
    filtered = db.customers.filter(c => c.tenantId === tenantId);
  }

  res.json(filtered);
});

// POST: Create Customer (Scoped to Tenant)
app.post("/api/customers", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { name, dni, email, phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  const newCustomer: Customer = {
    id: `cust_${Date.now()}`,
    tenantId,
    name,
    dni: dni || "",
    email: email || "",
    phone: phone || "",
    debt: 0,
    totalBought: 0,
    debts: [],
    registeredAt: new Date().toISOString()
  };

  db.customers.push(newCustomer);
  writeDB(db);
  res.status(201).json(newCustomer);
});

// PUT: Update Customer (Scoped to Tenant)
app.put("/api/customers/:id", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;
  const { name, dni, email, phone } = req.body;

  const custIdx = db.customers.findIndex(c => c.id === id && c.tenantId === tenantId);
  if (custIdx === -1) {
    return res.status(404).json({ error: "Cliente no encontrado o no pertenece a su comercio" });
  }

  const updatedCustomer = {
    ...db.customers[custIdx],
    ...(name !== undefined && { name }),
    ...(dni !== undefined && { dni }),
    ...(email !== undefined && { email }),
    ...(phone !== undefined && { phone })
  };

  db.customers[custIdx] = updatedCustomer;
  writeDB(db);
  res.json(updatedCustomer);
});

// POST: Register payment of debt for a customer (Scoped to Tenant)
app.post("/api/customers/:id/pay-debt", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;
  const { amount } = req.body;

  if (amount === undefined || Number(amount) <= 0) {
    return res.status(400).json({ error: "Debe ingresar un monto válido y mayor a cero" });
  }

  const custIdx = db.customers.findIndex(c => c.id === id && c.tenantId === tenantId);
  if (custIdx === -1) {
    return res.status(404).json({ error: "Cliente no encontrado o no pertenece a su comercio" });
  }

  const customer = db.customers[custIdx];
  let amountToPay = Number(amount);
  
  if (customer.debt <= 0) {
    return res.status(400).json({ error: "Este cliente no tiene deudas pendientes" });
  }

  const actualPaid = Math.min(amountToPay, customer.debt);
  customer.debt -= actualPaid;
  amountToPay = actualPaid;

  // Reduce specific item debts in order (oldest first)
  customer.debts = customer.debts.map(d => {
    if (amountToPay <= 0) return d;
    if (d.pendingAmount <= amountToPay) {
      amountToPay -= d.pendingAmount;
      return { ...d, pendingAmount: 0 };
    } else {
      const remaining = d.pendingAmount - amountToPay;
      amountToPay = 0;
      return { ...d, pendingAmount: remaining };
    }
  }).filter(d => d.pendingAmount > 0);

  // Update corresponding sales statuses for this tenant
  db.sales = db.sales.map(s => {
    if (s.tenantId === tenantId && s.customerId === id && s.paymentMethod === "cuenta_corriente" && s.status !== "pagado") {
      const remainingSaleDebts = customer.debts.filter(d => d.saleId === s.id);
      if (remainingSaleDebts.length === 0) {
        return { ...s, status: "pagado" as const };
      } else {
        const currentUnpaidAmount = remainingSaleDebts.reduce((acc, d) => acc + d.pendingAmount, 0);
        if (currentUnpaidAmount < s.debtAmount) {
          return { ...s, status: "parcialmente_pagado" as const };
        }
      }
    }
    return s;
  });

  writeDB(db);
  res.json({
    message: `Pago de $${actualPaid} registrado con éxito`,
    customer
  });
});

// DELETE: Delete Customer (Role and Tenant Scoped)
app.delete("/api/customers/:id", (req, res) => {
  const userRole = (req.headers["x-user-role"] as string) || "administrador";
  if (userRole === "vendedor") {
    return res.status(403).json({ error: "Permisos Insuficientes: El rol 'Vendedor' no tiene permisos para eliminar clientes. Requiere rol de 'Administrador'." });
  }

  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;

  const custIdx = db.customers.findIndex(c => c.id === id && c.tenantId === tenantId);
  if (custIdx === -1) {
    return res.status(404).json({ error: "Cliente no encontrado o no pertenece a su comercio" });
  }

  db.customers.splice(custIdx, 1);
  writeDB(db);
  res.json({ message: "Cliente eliminado con éxito", id });
});

// ==================== SALES API (Tenant Isolated) ====================

// GET: All Sales History (Filtered by Tenant)
app.get("/api/sales", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const filtered = db.sales.filter(s => s.tenantId === tenantId);
  res.json(filtered);
});

// POST: Perform a Sale (Scoped to Tenant)
app.post("/api/sales", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { customerId, items, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Debe incluir al menos un producto en la venta" });
  }

  if (!paymentMethod || !["contado", "transferencia", "cuenta_corriente", "tarjeta_debito", "tarjeta_credito"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Método de pago inválido" });
  }

  // Find customer of this tenant or default to anonymous customer
  let custIdx = -1;

  if (customerId) {
    custIdx = db.customers.findIndex(c => c.id === customerId && c.tenantId === tenantId);
  }

  // Fallback: If not found by exact ID, or if customerId is "cust_anonymous" or empty
  if (custIdx === -1) {
    custIdx = db.customers.findIndex(c => c.tenantId === tenantId && (
      c.id === customerId ||
      c.id.startsWith("cust_anonymous") ||
      c.name.toLowerCase() === "consumidor final"
    ));
  }

  // Auto-provision Consumidor Final for this tenant if still not found
  if (custIdx === -1) {
    const newAnon: Customer = {
      id: `cust_anonymous_${tenantId}`,
      tenantId,
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: new Date().toISOString()
    };
    db.customers.unshift(newAnon);
    custIdx = 0;
  }

  const customer = db.customers[custIdx];

  // Prevent anonymous customers from using debt/cuenta corriente
  if ((customer.id.startsWith("cust_anonymous") || customer.name.toLowerCase() === "consumidor final") && paymentMethod === "cuenta_corriente") {
    return res.status(400).json({ error: "El Consumidor Final no puede comprar a Cuenta Corriente (fiado)" });
  }

  // Validate Stock and fetch product details (must belong to this tenant)
  const saleItems: SaleItem[] = [];
  let saleTotal = 0;
  const dbUpdates: { prodIdx: number; newStock: number }[] = [];

  for (const item of items) {
    const { productId, quantity } = item;
    if (!productId || quantity === undefined || Number(quantity) <= 0) {
      return res.status(400).json({ error: "Cada item debe tener un código de producto y cantidad mayor a cero" });
    }

    const prodIdx = db.products.findIndex(p => p.id === productId && p.tenantId === tenantId);
    if (prodIdx === -1) {
      return res.status(404).json({ error: `Producto con ID ${productId} no existe en su comercio` });
    }

    const product = db.products[prodIdx];
    const qty = Number(quantity);

    if (product.stock < qty) {
      return res.status(400).json({
        error: `Stock insuficiente para '${product.name}'. Solicitado: ${qty}, Disponible: ${product.stock}`
      });
    }

    saleTotal += product.price * qty;
    saleItems.push({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: product.price
    });

    dbUpdates.push({
      prodIdx,
      newStock: product.stock - qty
    });
  }

  // Process transaction
  const saleId = `sale_${Date.now()}`;
  const isDebt = paymentMethod === "cuenta_corriente";

  const userId = (req.headers["x-user-id"] as string) || "";
  let userName = (req.headers["x-user-name"] as string) || "";
  if (userId) {
    const userObj = db.users.find(u => u.id === userId && u.tenantId === tenantId);
    if (userObj) {
      userName = userObj.name;
    }
  }
  if (!userName) {
    userName = "Vendedor General";
  }

  // Calculate progressive invoice sequence for this tenant
  const tenantSales = db.sales.filter(s => s.tenantId === tenantId);
  const maxSeq = tenantSales.reduce((max, s) => Math.max(max, s.invoiceSequence || 0), 0);
  const newSeq = maxSeq + 1;
  const invoiceNumber = `FAC-${String(newSeq).padStart(6, '0')}`;
  
  const newSale: Sale = {
    id: saleId,
    tenantId,
    invoiceNumber,
    invoiceSequence: newSeq,
    date: new Date().toISOString(),
    customerId: customer.id,
    customerName: customer.name,
    items: saleItems,
    total: saleTotal,
    paymentMethod,
    status: isDebt ? "pendiente" : "pagado",
    debtAmount: isDebt ? saleTotal : 0,
    userId: userId || undefined,
    userName: userName
  };

  // 1. Subtract product stock
  for (const update of dbUpdates) {
    db.products[update.prodIdx].stock = update.newStock;
  }

  // 2. Update customer statistics
  customer.totalBought += saleTotal;
  if (isDebt) {
    customer.debt += saleTotal;
    for (const item of saleItems) {
      customer.debts.push({
        saleId,
        date: newSale.date,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        pendingAmount: item.price * item.quantity
      });
    }
  }

  // Save everything
  db.sales.unshift(newSale);
  writeDB(db);

  res.status(201).json({
    message: "Venta realizada con éxito",
    sale: newSale,
    customerDebt: customer.debt,
    total: saleTotal
  });
});

// DELETE: Delete a transaction from history (Role and Tenant Scoped)
app.delete("/api/sales/:id", (req, res) => {
  const userRole = (req.headers["x-user-role"] as string) || "administrador";
  if (userRole === "vendedor") {
    return res.status(403).json({ error: "Permisos Insuficientes: El rol 'Vendedor' no tiene permisos para eliminar registros de ventas. Requiere rol de 'Administrador'." });
  }

  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;

  const saleIndex = db.sales.findIndex(s => s.id === id && s.tenantId === tenantId);
  if (saleIndex === -1) {
    return res.status(404).json({ error: "Transacción no encontrada o no pertenece a su comercio" });
  }

  const sale = db.sales[saleIndex];

  // Adjust customer stats if the customer exists and belongs to this tenant
  const custIdx = db.customers.findIndex(c => c.id === sale.customerId && c.tenantId === tenantId);
  if (custIdx !== -1) {
    const customer = db.customers[custIdx];
    customer.totalBought = Math.max(0, customer.totalBought - sale.total);
    
    if (sale.paymentMethod === "cuenta_corriente") {
      const unpaidForThisSale = customer.debts
        .filter(d => d.saleId === id)
        .reduce((sum, d) => sum + d.pendingAmount, 0);
      
      customer.debt = Math.max(0, customer.debt - unpaidForThisSale);
      customer.debts = customer.debts.filter(d => d.saleId !== id);
    }
  }

  db.sales.splice(saleIndex, 1);
  writeDB(db);
  res.json({ message: "Transacción eliminada con éxito", id });
});

// ==================== DAILY CLOSINGS API (Tenant Isolated) ====================

// GET: All Daily Closings for Tenant
app.get("/api/daily-closings", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  if (!db.dailyClosings) db.dailyClosings = [];
  const filtered = db.dailyClosings.filter(dc => dc.tenantId === tenantId);
  res.json(filtered);
});

// POST: Save a Daily Closing
app.post("/api/daily-closings", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  if (!db.dailyClosings) db.dailyClosings = [];

  const {
    id,
    date,
    closedAt,
    closedByUserId,
    closedByUserName,
    initialCash,
    cashSales,
    transferSales,
    debitCardSales,
    creditCardSales,
    creditSales,
    totalSales,
    expenses,
    expectedCash,
    actualCash,
    difference,
    notes
  } = req.body;

  const newClosing: DailyClosing = {
    id: id || `close_${Date.now()}`,
    tenantId,
    date: date || new Date().toISOString().split("T")[0],
    closedAt: closedAt || new Date().toISOString(),
    closedByUserId: closedByUserId || undefined,
    closedByUserName: closedByUserName || "Administrador",
    initialCash: Number(initialCash) || 0,
    cashSales: Number(cashSales) || 0,
    transferSales: Number(transferSales) || 0,
    debitCardSales: Number(debitCardSales) || 0,
    creditCardSales: Number(creditCardSales) || 0,
    creditSales: Number(creditSales) || 0,
    totalSales: Number(totalSales) || 0,
    expenses: Number(expenses) || 0,
    expectedCash: Number(expectedCash) || 0,
    actualCash: Number(actualCash) || 0,
    difference: Number(difference) || 0,
    notes: notes || undefined
  };

  db.dailyClosings.unshift(newClosing);
  writeDB(db);
  res.status(201).json({ message: "Cierre de caja guardado con éxito", dailyClosing: newClosing });
});

// ==================== USERS API (Tenant Isolated) ====================

// GET: All Users (Filtered by Tenant)
app.get("/api/users", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const filtered = db.users.filter(u => u.tenantId === tenantId);
  res.json(filtered);
});

// POST: Create/Add User (Scoped to Tenant)
app.post("/api/users", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { name, email, role, avatarUrl, photoUrl, avatar, password } = req.body;

  if (!name || !role) {
    return res.status(400).json({ error: "El nombre y el rol son obligatorios" });
  }

  const finalAvatar = avatarUrl || photoUrl || avatar || (
    role === "administrador"
      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  );

  // Default generated password if empty
  const finalPassword = password && password.trim() ? password.trim() : `${role === "administrador" ? "Admin" : "Vend"}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: User = {
    id: `user_${Date.now()}`,
    tenantId,
    name,
    email: email || `${name.toLowerCase().replace(/\s+/g, ".")}@comercio.com`,
    role: role as UserRole,
    avatarUrl: finalAvatar,
    photoUrl: finalAvatar,
    password: finalPassword
  };

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

// PUT: Update User (Scoped to Tenant)
app.put("/api/users/:id", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;
  const { name, email, role, avatarUrl, photoUrl, avatar, password } = req.body;

  const userIdx = db.users.findIndex(u => u.id === id && u.tenantId === tenantId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su comercio" });
  }

  const newAvatar = avatarUrl !== undefined ? avatarUrl : (photoUrl !== undefined ? photoUrl : (avatar !== undefined ? avatar : db.users[userIdx].avatarUrl));

  const updatedUser = {
    ...db.users[userIdx],
    ...(name !== undefined && { name }),
    ...(email !== undefined && { email }),
    ...(role !== undefined && { role: role as UserRole }),
    ...(newAvatar !== undefined && { avatarUrl: newAvatar, photoUrl: newAvatar }),
    ...(password !== undefined && { password: password.trim() })
  };

  db.users[userIdx] = updatedUser;
  writeDB(db);
  res.json(updatedUser);
});

// PATCH: Update user photo specifically (Scoped to Tenant)
app.patch("/api/users/:id/photo", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;
  const { avatarUrl, photoUrl, avatar, image } = req.body;

  const userIdx = db.users.findIndex(u => u.id === id && u.tenantId === tenantId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su comercio" });
  }

  const newPhoto = avatarUrl || photoUrl || avatar || image;
  if (!newPhoto) {
    return res.status(400).json({ error: "Se requiere la URL o imagen base64 de la foto ('photoUrl', 'avatarUrl' o 'image')" });
  }

  db.users[userIdx].avatarUrl = newPhoto;
  db.users[userIdx].photoUrl = newPhoto;
  writeDB(db);
  res.json({ message: "Foto de perfil actualizada con éxito", user: db.users[userIdx] });
});

// DELETE: Delete User (Scoped to Tenant & Role-Protected)
app.delete("/api/users/:id", (req, res) => {
  const userRole = (req.headers["x-user-role"] as string) || "administrador";
  if (userRole === "vendedor") {
    return res.status(403).json({ error: "Permisos Insuficientes: El rol 'Vendedor' no puede eliminar usuarios." });
  }

  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { id } = req.params;

  const userIdx = db.users.findIndex(u => u.id === id && u.tenantId === tenantId);
  if (userIdx === -1) {
    return res.status(404).json({ error: "Usuario no encontrado o no pertenece a su comercio" });
  }

  // Prevent deleting the last administrator
  const tenantAdmins = db.users.filter(u => u.tenantId === tenantId && u.role === "administrador");
  if (db.users[userIdx].role === "administrador" && tenantAdmins.length <= 1) {
    return res.status(400).json({ error: "Operación Denegada: Debe existir al menos un administrador en el comercio." });
  }

  db.users.splice(userIdx, 1);
  writeDB(db);
  res.json({ message: "Usuario de comercio eliminado con éxito", id });
});

// ==================== LOGIN LOGS API (Registro de Ingresos) ====================

// GET: Obtain login logs (Scoped to Tenant)
app.get("/api/login-logs", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  db.loginLogs = db.loginLogs || [];

  const filtered = db.loginLogs
    .filter(l => l.tenantId === tenantId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(filtered);
});

// POST: Record a new login with Date and Time
app.post("/api/login-logs", (req, res) => {
  const db = readDB();
  db.loginLogs = db.loginLogs || [];

  const tenantId = (req.headers["x-tenant-id"] as string) || req.body.tenantId || "tenant_jz";
  const { userId, userName, userEmail, role, deviceInfo } = req.body;

  if (!role) {
    return res.status(400).json({ error: "El rol (administrador o vendedor) es requerido" });
  }

  const now = new Date();
  const argTimeStr = now.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const dateFormatted = `${argTimeStr} hs (ARG)`;

  const newLog: LoginLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tenantId,
    userId: userId || `user_anon_${role}`,
    userName: userName || (role === "administrador" ? "Administrador General" : "Vendedor de Caja"),
    userEmail: userEmail || (role === "administrador" ? "admin@comercio.com" : "vendedor@comercio.com"),
    role: role as UserRole,
    timestamp: now.toISOString(),
    dateFormatted,
    deviceInfo: deviceInfo || "Navegador Web / PC"
  };

  db.loginLogs.unshift(newLog);

  // Keep max 500 records
  if (db.loginLogs.length > 500) {
    db.loginLogs = db.loginLogs.slice(0, 500);
  }

  writeDB(db);
  res.status(201).json(newLog);
});

// DELETE: Clear all login logs (Scoped to Tenant)
app.delete("/api/login-logs", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  db.loginLogs = (db.loginLogs || []).filter(l => {
    const itemTenant = l.tenantId || "tenant_jz";
    return itemTenant !== tenantId;
  });
  writeDB(db);
  res.json({ message: "Historial de ingresos del comercio vaciado con éxito" });
});

// DELETE: Delete individual login log by ID
app.delete("/api/login-logs/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.loginLogs = (db.loginLogs || []).filter(l => String(l.id) !== String(id));
  writeDB(db);
  res.json({ message: "Registro de ingreso eliminado con éxito", id });
});

// ==================== DATABASE BACKUP, RESTORE & CLEAR API ====================

// GET: Export entire tenant database state (Backup JSON for owner)
app.get("/api/database/backup", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const tenant = db.tenants.find(t => t.id === tenantId) || { id: tenantId, name: "Comercio Local" };

  const backupData = {
    exportDate: new Date().toISOString(),
    systemVersion: "2.5 Multitenant",
    tenant,
    products: db.products.filter(p => p.tenantId === tenantId),
    customers: db.customers.filter(c => c.tenantId === tenantId),
    sales: db.sales.filter(s => s.tenantId === tenantId),
    users: db.users.filter(u => u.tenantId === tenantId),
    loginLogs: (db.loginLogs || []).filter(l => l.tenantId === tenantId)
  };

  res.json(backupData);
});

// POST: Restore tenant database state from JSON backup file
app.post("/api/database/restore", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  const { products, customers, sales, loginLogs } = req.body;

  if (!Array.isArray(products) || !Array.isArray(customers) || !Array.isArray(sales)) {
    return res.status(400).json({ error: "Estructura de archivo de copia de seguridad no válida. Se requieren las secciones 'products', 'customers' y 'sales'." });
  }

  // Remove existing items for this tenant
  db.products = db.products.filter(p => p.tenantId !== tenantId);
  db.customers = db.customers.filter(c => c.tenantId !== tenantId);
  db.sales = db.sales.filter(s => s.tenantId !== tenantId);
  if (db.loginLogs) {
    db.loginLogs = db.loginLogs.filter(l => l.tenantId !== tenantId);
  } else {
    db.loginLogs = [];
  }

  // Inject restored items tagged with tenantId
  const restoredProducts = products.map((p: any) => ({ ...p, tenantId }));
  const restoredCustomers = customers.map((c: any) => ({ ...c, tenantId }));
  const restoredSales = sales.map((s: any) => ({ ...s, tenantId }));
  const restoredLogs = Array.isArray(loginLogs) ? loginLogs.map((l: any) => ({ ...l, tenantId })) : [];

  db.products.push(...restoredProducts);
  db.customers.push(...restoredCustomers);
  db.sales.push(...restoredSales);
  db.loginLogs.push(...restoredLogs);

  // Guarantee default anonymous customer exists
  const anonId = `cust_anonymous_${tenantId}`;
  if (!db.customers.some(c => c.id === anonId && c.tenantId === tenantId)) {
    db.customers.unshift({
      id: anonId,
      tenantId,
      name: "Consumidor Final",
      email: "consumidor@final.com",
      phone: "-",
      debt: 0,
      totalBought: 0,
      debts: [],
      registeredAt: new Date().toISOString()
    });
  }

  writeDB(db);
  res.json({
    message: "Base de datos restaurada con éxito",
    counts: {
      products: restoredProducts.length,
      customers: restoredCustomers.length,
      sales: restoredSales.length
    }
  });
});

// POST: Clear database completely (Start blank for new shift/owner)
app.post("/api/database/clear", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";
  
  // Clear products, sales, non-anonymous customers for this tenant
  db.products = db.products.filter(p => p.tenantId !== tenantId);
  db.sales = db.sales.filter(s => s.tenantId !== tenantId);
  
  // Keep only default anonymous customer
  const anonId = `cust_anonymous_${tenantId}`;
  db.customers = db.customers.filter(c => c.tenantId !== tenantId);
  db.customers.unshift({
    id: anonId,
    tenantId,
    name: "Consumidor Final",
    email: "consumidor@final.com",
    phone: "-",
    debt: 0,
    totalBought: 0,
    debts: [],
    registeredAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({ message: "Base de datos vaciada con éxito. El sistema ha quedado en blanco para ingresar clientes, artículos y ventas desde cero." });
});

// POST: Restablecer datos de prueba (Demo Seed)
app.post("/api/database/seed-demo", (req, res) => {
  const db = readDB();
  const tenantId = (req.headers["x-tenant-id"] as string) || "tenant_jz";

  db.products = db.products.filter(p => p.tenantId !== tenantId);
  db.customers = db.customers.filter(c => c.tenantId !== tenantId);
  db.sales = db.sales.filter(s => s.tenantId !== tenantId);

  const demoProducts = [
    { id: `prod_demo_1_${Date.now()}`, tenantId, name: "Remera Básica Negra", category: "Ropa", price: 12000, cost: 5500, stock: 25, minStock: 5 },
    { id: `prod_demo_2_${Date.now()}`, tenantId, name: "Jean Slim Blue", category: "Ropa", price: 35000, cost: 16000, stock: 15, minStock: 3 },
    { id: `prod_demo_3_${Date.now()}`, tenantId, name: "Zapatilla Urbana N° 39", category: "Calzado", price: 45000, cost: 21000, stock: 10, minStock: 2 }
  ];

  const anonId = `cust_anonymous_${tenantId}`;
  const demoCustomers = [
    { id: anonId, tenantId, name: "Consumidor Final", email: "consumidor@final.com", phone: "-", debt: 0, totalBought: 0, debts: [], registeredAt: new Date().toISOString() },
    { id: `cust_demo_1_${Date.now()}`, tenantId, name: "Juan Pérez", email: "juan@perez.com", phone: "1123456789", debt: 0, totalBought: 47000, debts: [], registeredAt: new Date().toISOString() },
    { id: `cust_demo_2_${Date.now()}`, tenantId, name: "María Gómez", email: "maria@gomez.com", phone: "1187654321", debt: 12000, totalBought: 12000, debts: [{ saleId: "sale_demo_1", date: new Date().toISOString(), productId: demoProducts[0].id, productName: demoProducts[0].name, quantity: 1, price: 12000, pendingAmount: 12000 }], registeredAt: new Date().toISOString() }
  ];

  const demoSales = [
    {
      id: `sale_demo_1_${Date.now()}`,
      tenantId,
      invoiceNumber: "FAC-000001",
      invoiceSequence: 1,
      date: new Date().toISOString(),
      customerId: demoCustomers[2].id,
      customerName: demoCustomers[2].name,
      items: [{ productId: demoProducts[0].id, productName: demoProducts[0].name, quantity: 1, price: 12000, cost: 5500 }],
      total: 12000,
      paymentMethod: "cuenta_corriente" as const,
      status: "pendiente" as const,
      debtAmount: 12000,
      userName: "Admin General"
    }
  ];

  db.products.push(...demoProducts);
  db.customers.push(...demoCustomers);
  db.sales.push(...demoSales);

  writeDB(db);
  res.json({ message: "Datos demo restablecidos con éxito" });
});

// Global Express error handler to guarantee JSON formatted error responses
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("[Express Error]:", err);
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({ error: "El archivo o foto de perfil enviada excede el tamaño máximo permitido (50MB)." });
    }
    return res.status(err.status || 500).json({ error: err.message || "Error interno del servidor" });
  }
  next();
});

// ========================================================

// Vite and static file serving configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SaaS Express] Servidor ejecutándose en el puerto http://localhost:${PORT}`);
  });
}

startServer();
