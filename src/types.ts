export type UserRole = "administrador" | "vendedor";

export interface Tenant {
  id: string;
  name: string;
  plan: "Plan Básico" | "Plan Premium" | "Plan Pro";
  status: "active" | "suspended";
  paymentGateway: "mercado_pago" | "stripe";
  monthlyPrice: number;
  nextBillingDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  photoUrl?: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
}

export interface UnpaidItem {
  saleId: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  pendingAmount: number;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  debt: number;
  totalBought: number;
  debts: UnpaidItem[];
  registeredAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  tenantId: string;
  date: string;
  customerId: string; // "cust_anonymous" or a customer ID
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentMethod: "contado" | "transferencia" | "cuenta_corriente";
  status: "pagado" | "pendiente" | "parcialmente_pagado";
  debtAmount: number;
  userId?: string;
  userName?: string;
}

export interface LoginLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  timestamp: string;
  dateFormatted: string;
  deviceInfo?: string;
}

export interface DBState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  tenants: Tenant[];
  users: User[];
  loginLogs?: LoginLog[];
}
