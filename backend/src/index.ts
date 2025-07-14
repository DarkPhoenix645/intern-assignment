import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import cors from "cors";
import { Request, Response, Application } from "express";
import { exit } from "process";
import cloudinary from "cloudinary";

import { configDotenv } from "dotenv";
configDotenv();

import errorHandler from "@middleware/errorHandler";
import userRouter from "@routes/userRoutes";
// import adminRouter from '@routes/adminRoutes';

const app: Application = express();
const port = process.env.PORT || 8080;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use(userRouter);
// app.use(adminRouter);
app.use(errorHandler);

const startServer = async () => {
  app.listen(port, async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI as string);
      console.log("Connected to database");
      console.log(`Server is running at http://localhost:${port}`);
    } catch (error: any) {
      console.error(error?.message);
      console.error("Aborting application...");
      exit(1);
    }
  });
};

startServer();
