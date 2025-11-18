export type Role = 'admin' | 'mechanic';

export interface UserDoc { uid: string; email: string; name?: string; role: Role }
export interface Customer { id?: string; name: string; phone?: string; email?: string; address?: string }
export interface Unit { id?: string; customerId: string; make: string; model: string; year?: number; plate?: string }
export interface Sparepart { id: string; name: string; sku?: string; stock: number; price: number; lowStockThreshold: number }
export interface Mechanic { id: string; name: string; phone?: string; skills?: string[] }
export interface ServiceOrder { id: string; customerId: string; unitId: string; mechanicId: string; laborCost: number; totalCost: number; status?: string; createdAt?: any }
export interface ServiceItem { id?: string; partId: string; qty: number; price: number }
