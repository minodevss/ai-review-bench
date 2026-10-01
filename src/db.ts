import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export interface Order {
  id: string;
  user_id: string;
  status: "pending" | "paid" | "refunded";
  subtotal_cents: number;
  total_cents: number;
  payment_id: string | null;
  created_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  sku: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
}

export async function query<T extends pg.QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
