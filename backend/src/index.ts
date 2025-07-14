import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { Request, Response, Application } from 'express';
import { exit } from 'process';
import cloudinary from 'cloudinary';

import { configDotenv } from 'dotenv';
configDotenv();

import errorHandler from '@middleware/errorHandler';
import userRouter from '@routes/userRoutes';
import logger from '@utils/logger';
import { request } from 'urllib';

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

// Atlas Search Environment Setup
const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v1.0';
const ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID;
const ATLAS_CLUSTER_NAME = process.env.MONGODB_ATLAS_CLUSTER;
const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes`;
const USER_SEARCH_INDEX_NAME = 'note_search';
const USER_AUTOCOMPLETE_INDEX_NAME = 'note_autocomplete';

const ATLAS_API_PUBLIC_KEY = process.env.MONGODB_ATLAS_PUBLIC_KEY;
const ATLAS_API_PRIVATE_KEY = process.env.MONGODB_ATLAS_PRIVATE_KEY;
const DIGEST_AUTH = `${ATLAS_API_PUBLIC_KEY}:${ATLAS_API_PRIVATE_KEY}`;

const NOTE_DB = 'test';
const NOTE_COLLECTION = 'note';
const MONGODB_HOST = process.env.MONGODB_HOST as string;

if (!MONGODB_HOST) {
  throw new Error('MONGODB_HOST environment variable is required');
}
if (!NOTE_DB) {
  console.log(MONGODB_HOST);
  console.log(NOTE_DB);
  throw new Error('MONGODB_DATABASE environment variable is required, or MONGODB_HOST must include a database name.');
}

async function findAtlasIndexByName(indexName: string) {
  try {
    const res = await request(`${ATLAS_SEARCH_INDEX_API_URL}/${NOTE_DB}/${NOTE_COLLECTION}`, {
      dataType: 'json',
      contentType: 'application/json',
      method: 'GET',
      digestAuth: DIGEST_AUTH,
    });

    if (res.statusCode === 200) {
      return (res.data as any[]).find((i) => i.name === indexName);
    } else {
      logger.error.SERVER_MSG(`Failed to fetch Atlas Search indexes: ${JSON.stringify(res.data)}`);
      return undefined;
    }
  } catch (error) {
    logger.error.SERVER_MSG(`Error finding Atlas index: ${error}`);
    return undefined;
  }
}

async function upsertAtlasSearchIndex() {
  const searchIndex = await findAtlasIndexByName(USER_SEARCH_INDEX_NAME);
  if (!searchIndex) {
    try {
      const res = await request(ATLAS_SEARCH_INDEX_API_URL, {
        data: {
          name: USER_SEARCH_INDEX_NAME,
          database: NOTE_DB,
          collectionName: NOTE_COLLECTION,
          mappings: {
            dynamic: false,
            fields: {
              title: [{ type: 'string' }],
              content: [{ type: 'string' }],
            },
          },
        },
        dataType: 'json',
        contentType: 'application/json',
        method: 'POST',
        digestAuth: DIGEST_AUTH,
      });

      if (res.statusCode === 200) {
        logger.info.SERVER_MSG('Created Atlas note_search index');
      } else {
        logger.error.SERVER_MSG(`Failed to create Atlas Search index: ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      logger.error.SERVER_MSG(`Error creating Atlas Search index: ${error}`);
    }
  } else {
    logger.info.SERVER_MSG('Atlas note_search index already exists');
  }
}

async function upsertAtlasAutocompleteIndex() {
  const autocompleteIndex = await findAtlasIndexByName(USER_AUTOCOMPLETE_INDEX_NAME);
  if (!autocompleteIndex) {
    try {
      const res = await request(ATLAS_SEARCH_INDEX_API_URL, {
        data: {
          name: USER_AUTOCOMPLETE_INDEX_NAME,
          database: NOTE_DB,
          collectionName: NOTE_COLLECTION,
          mappings: {
            dynamic: false,
            fields: {
              title: [
                {
                  type: 'autocomplete',
                  tokenization: 'edgeGram',
                  minGrams: 2,
                  maxGrams: 7,
                },
              ],
            },
          },
        },
        dataType: 'json',
        contentType: 'application/json',
        method: 'POST',
        digestAuth: DIGEST_AUTH,
      });

      if (res.statusCode === 200) {
        logger.info.SERVER_MSG('Created Atlas note_autocomplete index');
      } else {
        logger.error.SERVER_MSG(`Failed to create Atlas Autocomplete index: ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      logger.error.SERVER_MSG(`Error creating Atlas Autocomplete index: ${error}`);
    }
  } else {
    logger.info.SERVER_MSG('Atlas note_autocomplete index already exists');
  }
}

const startServer = async () => {
  await mongoose.connect(MONGODB_HOST);
  logger.info.SERVER_MSG('Connected to database');
  await upsertAtlasSearchIndex();
  await upsertAtlasAutocompleteIndex();
  app.listen(port, () => {
    logger.info.SERVER_MSG(`Server is running at http://localhost:${port}`);
  });
};

startServer();
