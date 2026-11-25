
import type { Request, Response, NextFunction } from "express";
import {
  getAllProducts,
  getProductById,
} from "../services/product.service.js";

export async function getProductsController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const products = await getAllProducts();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductController(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
      return;
    }

    const product = await getProductById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
