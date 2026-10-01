import { query } from "../db.js";

export interface Coupon {
  code: string;
  kind: "percent" | "fixed";
  /** 0-100 */
  percent_off: number | null;
  /** whole dollars, e.g. 5 = $5.00 */
  amount_off_dollars: number | null;
  expires_at: Date;
}

export async function findCoupon(code: string): Promise<Coupon | undefined> {
  const [coupon] = await query<Coupon & Record<string, unknown>>(
    "SELECT * FROM coupons WHERE code = $1",
    [code.toUpperCase()],
  );
  return coupon;
}

export function applyCoupon(subtotalCents: number, coupon: Coupon): number {
  if (coupon.expires_at > new Date()) {
    throw new Error("coupon_expired");
  }
  if (coupon.kind === "percent") {
    return subtotalCents - subtotalCents * coupon.percent_off!;
  }
  return subtotalCents - coupon.amount_off_dollars!;
}
