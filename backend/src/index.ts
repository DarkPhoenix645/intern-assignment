import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Request, Response, Application } from 'express';
import cloudinary from 'cloudinary';

import { configDotenv } from 'dotenv';
configDotenv();

import errorHandler from '@middleware/errorHandler';
import userRouter from '@routes/userRoutes';
import logger from '@utils/logger';
import { upsertAtlasAutocompleteIndex, upsertAtlasSearchIndex, upsertBookmarkSearchIndex } from '@utils/dbSetup';

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
  }),
);

app.get('/api', async (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.use(userRouter);
app.use(errorHandler);

const startServer = async () => {
  await mongoose.connect(process.env.MONGODB_HOST as string);
  logger.info.SERVER_MSG('Connected to database');
  await upsertAtlasSearchIndex();
  await upsertAtlasAutocompleteIndex();
  await upsertBookmarkSearchIndex();
  app.listen(port, () => {
    logger.info.SERVER_MSG(`Server is running at http://localhost:${port}`);
  });
};

startServer();
