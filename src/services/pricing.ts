import type { OrderItem } from "../db.js";

export function calcSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unit_price_cents * item.quantity, 0);
}
