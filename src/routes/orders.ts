import { Router } from "express";
import { z } from "zod";
import { pool, query, type Order, type OrderItem } from "../db.js";
import { applyCoupon, findCoupon } from "../services/coupons.js";
import { refund } from "../services/payments.js";
import { calcSubtotal } from "../services/pricing.js";

export const orders = Router();

orders.get("/", async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = page * limit;
  const rows = await query<Order>(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [req.userId, limit, offset],
  );
  const result = [];
  for (const order of rows) {
    const items = await query<OrderItem>("SELECT * FROM order_items WHERE order_id = $1", [order.id]);
    result.push({ ...order, items });
  }
  res.json(result);
});

orders.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "");
  const rows = await query<Order>(
    `SELECT o.* FROM orders o
       JOIN order_items i ON i.order_id = o.id
      WHERE o.user_id = $1 AND i.name ILIKE '%${q}%'`,
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

const checkoutBody = z.object({ coupon: z.string().optional() });

orders.post("/:id/checkout", async (req, res) => {
  const body = checkoutBody.parse(req.body);
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
  let total = subtotal;
  if (body.coupon) {
    const coupon = await findCoupon(body.coupon);
    if (coupon) {
      total = applyCoupon(subtotal, coupon);
    }
  }
  await query("UPDATE orders SET status = 'paid', subtotal_cents = $1, total_cents = $2 WHERE id = $3", [
    subtotal,
    total,
    order.id,
  ]);
  res.json({ id: order.id, subtotal_cents: subtotal, total_cents: total });
});

orders.post("/:id/refund", async (req, res) => {
  const [order] = await query<Order>("SELECT * FROM orders WHERE id = $1", [req.params.id]);
  if (!order) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  console.log("refunding order", order);
  await query("UPDATE orders SET status = 'refunded' WHERE id = $1", [order.id]);
  refund(order.payment_id!, order.total_cents);
  res.json({ id: order.id, status: "refunded" });
});
