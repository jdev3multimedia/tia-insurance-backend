import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import occupancyRoutes from "./routes/occupancy.routes.js";
import locationRoutes from "./routes/location.routes.js";

import fireInsuranceRoutes from "./routes/fireInsurance.routes.js";
import businessInsuranceRoutes from "./routes/businessInsurance.routes.js";
import iarInsuranceRoutes from "./routes/iarInsurance.routes.js";

import planRoutes from "./routes/plan.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

const app = express();

//CORS (ADD THIS - does NOT affect existing logic)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/occupancy", occupancyRoutes);
app.use("/api/location", locationRoutes);

app.use("/api/fire-insurance", fireInsuranceRoutes);
app.use("/api/business-insurance", businessInsuranceRoutes);
app.use("/api/iar-insurance", iarInsuranceRoutes);

app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);


// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

export default app;