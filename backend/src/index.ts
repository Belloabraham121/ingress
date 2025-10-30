import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./server";
import { connectDatabase } from "./config/database";

let isInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isInitialized) {
    try {
      await connectDatabase();
      // Disable long-running polling on serverless by default
      process.env.DISABLE_EXCHANGE_POLLING =
        process.env.DISABLE_EXCHANGE_POLLING || "true";
      isInitialized = true;
    } catch (err) {
      console.error("❌ Failed to initialize serverless handler:", err);
      res
        .status(500)
        .json({ success: false, message: "Initialization failed" });
      return;
    }
  }

  // Delegate to Express app
  (app as any)(req, res);
}
