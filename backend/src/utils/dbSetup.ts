import axios from 'axios';
import crypto from 'crypto';
import logger from '@utils/logger';

// Atlas Search Environment Setup
const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v2';
const ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID;
const ATLAS_CLUSTER_NAME = process.env.MONGODB_ATLAS_CLUSTER;
const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/search/indexes`;

const ATLAS_SERVICE_ACC_CLIENT_ID = process.env.MONGODB_ATLAS_SERVICE_ACC_CLIENT_ID;
const ATLAS_SERVICE_ACC_CLIENT_SECRET = process.env.MONGODB_ATLAS_SERVICE_ACC_CLIENT_SECRET;

const NOTE_DB = 'test';
const NOTE_COLLECTION = 'notes';
const NOTE_SEARCH_INDEX_NAME = 'note_search';
const NOTE_AUTOCOMPLETE_INDEX_NAME = 'note_autocomplete';

const BOOKMARK_COLLECTION = 'bookmarks';
const BOOKMARK_SEARCH_INDEX_NAME = 'bookmark_search';

const MONGODB_HOST = process.env.MONGODB_HOST as string;

if (!MONGODB_HOST) {
  throw new Error('MONGODB_HOST environment variable is required');
}
if (!NOTE_DB) {
  console.log(MONGODB_HOST);
  console.log(NOTE_DB);
  throw new Error('MONGODB_DATABASE environment variable is required, or MONGODB_HOST must include a database name.');
}

let atlasAccessToken: string | null = null;
let atlasAccessTokenExpiry: number | null = null;

async function getAtlasAccessToken(): Promise<string> {
  const now = Date.now();
  if (atlasAccessToken && atlasAccessTokenExpiry && now < atlasAccessTokenExpiry) {
    return atlasAccessToken;
  }

  const clientId = ATLAS_SERVICE_ACC_CLIENT_ID as string;
  const clientSecret = ATLAS_SERVICE_ACC_CLIENT_SECRET as string;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post('https://cloud.mongodb.com/api/oauth/token', 'grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  });

  atlasAccessToken = response.data.access_token;
  // expires_in is in seconds
  atlasAccessTokenExpiry = now + response.data.expires_in * 1000 - 60000; // refresh 1 min before expiry
  return atlasAccessToken as string;
}

const ATLAS_API_ACCEPT_HEADER = 'application/vnd.atlas.2024-05-30+json'; // or the latest version you want

async function axiosRequest(method: string, url: string, data?: any) {
  const accessToken = await getAtlasAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: ATLAS_API_ACCEPT_HEADER,
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data,
    });
    return { statusCode: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { statusCode: error.response.status, data: error.response.data };
    } else if (error.request) {
      throw new Error(`No response received from API: ${error.message}`);
    } else {
      throw new Error(`Error setting up API request: ${error.message}`);
    }
  }
}

async function findAtlasIndexByName(indexName: string) {
  try {
    const url = `${ATLAS_SEARCH_INDEX_API_URL}/${NOTE_DB}/${NOTE_COLLECTION}`;
    const res = await axiosRequest('GET', url);

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
  const searchIndex = await findAtlasIndexByName(NOTE_SEARCH_INDEX_NAME);
  if (!searchIndex) {
    try {
      const res = await axiosRequest('POST', ATLAS_SEARCH_INDEX_API_URL, {
        name: NOTE_SEARCH_INDEX_NAME,
        database: NOTE_DB,
        collectionName: NOTE_COLLECTION,
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              title: { type: 'string' },
              content: { type: 'string' },
            },
          },
        },
      });

      if (res.statusCode === 201) {
        // Atlas API returns 201 Created for successful creation
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
  const autocompleteIndex = await findAtlasIndexByName(NOTE_AUTOCOMPLETE_INDEX_NAME);
  if (!autocompleteIndex) {
    try {
      const res = await axiosRequest('POST', ATLAS_SEARCH_INDEX_API_URL, {
        name: NOTE_AUTOCOMPLETE_INDEX_NAME,
        database: NOTE_DB,
        collectionName: NOTE_COLLECTION,
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              title: {
                type: 'autocomplete',
                tokenization: 'edgeGram',
                minGrams: 2,
                maxGrams: 7,
              },
            },
          },
        },
      });

      if (res.statusCode === 201) {
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

async function findBookmarkAtlasIndexByName(indexName: string) {
  try {
    const url = `${ATLAS_SEARCH_INDEX_API_URL}/${NOTE_DB}/${BOOKMARK_COLLECTION}`;
    const res = await axiosRequest('GET', url);
    if (res.statusCode === 200) {
      return (res.data as any[]).find((i) => i.name === indexName);
    } else {
      logger.error.SERVER_MSG(`Failed to fetch Atlas Search indexes for bookmark: ${JSON.stringify(res.data)}`);
      return undefined;
    }
  } catch (error) {
    logger.error.SERVER_MSG(`Error finding Atlas bookmark index: ${error}`);
    return undefined;
  }
}

async function upsertBookmarkSearchIndex() {
  const searchIndex = await findBookmarkAtlasIndexByName(BOOKMARK_SEARCH_INDEX_NAME);
  if (!searchIndex) {
    try {
      const res = await axiosRequest('POST', ATLAS_SEARCH_INDEX_API_URL, {
        name: BOOKMARK_SEARCH_INDEX_NAME,
        database: NOTE_DB,
        collectionName: BOOKMARK_COLLECTION,
        type: 'search',
        definition: {
          mappings: {
            dynamic: false,
            fields: {
              url: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      });
      if (res.statusCode === 201) {
        logger.info.SERVER_MSG('Created Atlas bookmark_search index');
      } else {
        logger.error.SERVER_MSG(`Failed to create Atlas bookmark_search index: ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      logger.error.SERVER_MSG(`Error creating Atlas bookmark_search index: ${error}`);
    }
  } else {
    logger.info.SERVER_MSG('Atlas bookmark_search index already exists');
  }
}

export {
  findAtlasIndexByName,
  upsertAtlasSearchIndex,
  upsertAtlasAutocompleteIndex,
  findBookmarkAtlasIndexByName,
  upsertBookmarkSearchIndex,
};
