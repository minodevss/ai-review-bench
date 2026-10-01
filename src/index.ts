import express from "express";
import { requireUser } from "./auth.js";
import { orders } from "./routes/orders.js";

const app = express();
app.use(express.json());
app.use("/orders", requireUser, orders);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`order-service listening on :${port}`);
});
