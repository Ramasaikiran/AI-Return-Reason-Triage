import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { classifyReturn } from "./classifier";
import { TriageRequestSchema, TriageResponse } from "./schemas";

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "mumzworld-return-triage" });
});

// Triage endpoint
app.post("/triage", async (req: Request, res: Response) => {
  // Validate request body
  const parsed = TriageRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const response: TriageResponse = {
      success: false,
      error: `Invalid request: ${parsed.error.issues.map(i => i.message).join(", ")}`,
    };
    return res.status(422).json(response);
  }

  try {
    const result = await classifyReturn(parsed.data.text);
    const response: TriageResponse = { success: true, result };
    return res.json(response);
  } catch (err) {
    if (err instanceof ZodError) {
      // Schema mismatch — explicit, never silent
      const response: TriageResponse = {
        success: false,
        error: `Schema validation failed: ${err.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
      };
      return res.status(422).json(response);
    }

    const message = err instanceof Error ? err.message : "Unknown error";
    const response: TriageResponse = { success: false, error: message };
    return res.status(500).json(response);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✓ Mumzworld Triage API running at http://localhost:${PORT}`);
});

export default app;
