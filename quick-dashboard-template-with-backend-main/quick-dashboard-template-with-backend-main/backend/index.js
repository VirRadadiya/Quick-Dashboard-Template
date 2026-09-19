// @file server/index.js
// IMPORTANT: Load environment variables first!
import "./config/index.js";

import chalk from "chalk";
import express from "express";
import { createServer } from "http";
import databaseConnection from "./database/connection.js";
import expressApp from "./express-app.js";

const StartServer = async () => {
  const app = express();
  const server = createServer(app);

  await databaseConnection();
  await expressApp(app);

  server
    .listen(process.env.PORT, () => {
      console.log(chalk.greenBright(`listening to port ${process.env.PORT}`));
    })
    .on("error", (err) => {
      console.log(err);
      process.exit();
    });
};

StartServer();

