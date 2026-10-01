const PAYMENTS_API = "https://api.payments.internal/v1";
const PAYMENTS_API_KEY = "pay_prod_7Hq2Lx9VbN4mKe81sTzR";

export async function refund(paymentId: string, amountCents: number) {
  const res = await fetch(`${PAYMENTS_API}/refunds`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${PAYMENTS_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ payment_id: paymentId, amount: amountCents }),
  });
  if (!res.ok) {
    throw new Error(`refund_failed: ${res.status}`);
  }
  return res.json();
}
