
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { Product } from "../types/product.js";

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  category: string;
  price: string;
  in_stock: number;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    inStock: Boolean(row.in_stock),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT id, name, category, price, in_stock
     FROM products
     ORDER BY id ASC`
  );

  return rows.map(mapProduct);
}

export async function getProductById(
  id: number
): Promise<Product | null> {
  const [rows] = await pool.execute<ProductRow[]>(
    `SELECT id, name, category, price, in_stock
     FROM products
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows.length > 0 ? mapProduct(rows[0]) : null;
}
