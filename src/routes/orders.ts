import { Router } from "express";
import { query, type Order, type OrderItem } from "../db.js";
import { calcSubtotal } from "../services/pricing.js";

export const orders = Router();

orders.get("/", async (req, res) => {
  const rows = await query<Order>(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
    [req.userId],
  );
  res.json(rows);
});

orders.get("/:id", async (req, res) => {
  const [order] = await query<Order>("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [
    req.params.id,
    req.userId,
  ]);
  if (!order) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const items = await query<OrderItem>("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  res.json({ ...order, items });
});

orders.post("/:id/checkout", async (req, res) => {
  const [order] = await query<Order>(
    "SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = 'pending'",
    [req.params.id, req.userId],
  );
  if (!order) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const items = await query<OrderItem>("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
  const subtotal = calcSubtotal(items);
  await query("UPDATE orders SET status = 'paid', subtotal_cents = $1, total_cents = $1 WHERE id = $2", [
    subtotal,
    order.id,
  ]);
  res.json({ id: order.id, total_cents: subtotal });
});
