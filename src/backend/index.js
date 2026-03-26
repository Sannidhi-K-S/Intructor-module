import express from "express";
import sessionRoutes from "./session.routes.js";

const router = express.Router();

router.use("/sessions", sessionRoutes);

export default router;