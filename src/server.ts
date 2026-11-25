
import "dotenv/config";
import { app } from "./app.js";
import { testDatabaseConnection } from "./config/database.js";

const port = Number(process.env.PORT ?? 4000);

async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(port, "127.0.0.1", () => {
      console.log(`Tree Shop API: http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start API:", error);
    process.exit(1);
  }
}

startServer();
