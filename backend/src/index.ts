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
const ENV = process.env.NODE_ENV;

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (ENV == 'production') {
  logger.info.SERVER_MSG('Runnning in Production Mode');
  app.use(
    cors({
      origin: process.env.SITE_URL,
      credentials: true,
      optionsSuccessStatus: 200,
      maxAge: 86400,
    }),
  );
} else {
  logger.info.SERVER_MSG('Runnning in Dev Mode');
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}

app.use(cookieParser());
app.use(express.json());

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
