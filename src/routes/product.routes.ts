
import { Router } from "express";
import {
  getProductsController,
  getProductController,
} from "../controllers/product.controller.js";

export const productRouter = Router();

productRouter.get("/", getProductsController);
productRouter.get("/:id", getProductController);
