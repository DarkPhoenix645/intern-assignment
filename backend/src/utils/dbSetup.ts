import axios from 'axios';
import crypto from 'crypto';
import logger from '@utils/logger';

// Atlas Search Environment Setup
const ATLAS_API_BASE_URL = 'https://cloud.mongodb.com/api/atlas/v2';
const ATLAS_PROJECT_ID = process.env.MONGODB_ATLAS_PROJECT_ID;
const ATLAS_CLUSTER_NAME = process.env.MONGODB_ATLAS_CLUSTER;
const ATLAS_CLUSTER_API_URL = `${ATLAS_API_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes`;

const ATLAS_API_PUBLIC_KEY = process.env.MONGODB_ATLAS_PUBLIC_KEY;
const ATLAS_API_PRIVATE_KEY = process.env.MONGODB_ATLAS_PRIVATE_KEY;

const NOTE_DB = 'test';
const NOTE_COLLECTION = 'note';
const NOTE_SEARCH_INDEX_NAME = 'note_search';
const NOTE_AUTOCOMPLETE_INDEX_NAME = 'note_autocomplete';

const BOOKMARK_COLLECTION = 'bookmark';
const BOOKMARK_SEARCH_INDEX_NAME = 'bookmark_search';
const BOOKMARK_AUTOCOMPLETE_INDEX_NAME = 'bookmark_autocomplete';

const MONGODB_HOST = process.env.MONGODB_HOST as string;

if (!MONGODB_HOST) {
  throw new Error('MONGODB_HOST environment variable is required');
}
if (!NOTE_DB) {
  console.log(MONGODB_HOST);
  console.log(NOTE_DB);
  throw new Error('MONGODB_DATABASE environment variable is required, or MONGODB_HOST must include a database name.');
}

/**
 * Generates the Authorization header for Digest authentication.
 * Note: This is a simplified version and might not cover all edge cases of Digest authentication.
 * For production environments, consider using a more robust Digest authentication library if available,
 * or ensure `axios-digest` is correctly implemented if that's what `request` was using.
 * MongoDB Atlas often uses a realm like 'MongoDB Realm' for digest.
 */
function getAtlasDigestAuthHeader(method: string, urlPath: string, username: string, password: string) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const realm = 'MongoDB Realm'; // Common realm for MongoDB Atlas
  const qop = 'auth';
  const nc = '00000001'; // Nonce count, increments with each request, but for simplicity here, it's fixed.
  const cnonce = crypto.randomBytes(16).toString('hex');

  const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method}:${urlPath}`).digest('hex');

  const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

  return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${urlPath}", qop="${qop}", nc="${nc}", cnonce="${cnonce}", response="${response}", algorithm="MD5"`;
}

async function axiosRequest(method: string, url: string, data?: any) {
  const urlPath = url.replace(ATLAS_API_BASE_URL, ''); // Extract the path for Digest Auth URI
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json', // Using application/json as a general accept for Atlas APIs
    Authorization: getAtlasDigestAuthHeader(
      method,
      urlPath,
      ATLAS_API_PUBLIC_KEY as string,
      ATLAS_API_PRIVATE_KEY as string,
    ),
  };

  try {
    const response = await axios({
      method: method,
      url: url,
      headers: headers,
      data: data,
    });
    return { statusCode: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return { statusCode: error.response.status, data: error.response.data };
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`No response received from API: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
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
        mappings: {
          dynamic: false,
          fields: {
            title: [{ type: 'string' }],
            content: [{ type: 'string' }],
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
      });

      if (res.statusCode === 201) {
        // Atlas API returns 201 Created for successful creation
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
        mappings: {
          dynamic: false,
          fields: {
            url: [{ type: 'string' }],
            title: [{ type: 'string' }],
            description: [{ type: 'string' }],
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

async function upsertBookmarkAutocompleteIndex() {
  const autocompleteIndex = await findBookmarkAtlasIndexByName(BOOKMARK_AUTOCOMPLETE_INDEX_NAME);
  if (!autocompleteIndex) {
    try {
      const res = await axiosRequest('POST', ATLAS_SEARCH_INDEX_API_URL, {
        name: BOOKMARK_AUTOCOMPLETE_INDEX_NAME,
        database: NOTE_DB,
        collectionName: BOOKMARK_COLLECTION,
        mappings: {
          dynamic: false,
          fields: {
            url: [
              {
                type: 'autocomplete',
                tokenization: 'edgeGram',
                minGrams: 2,
                maxGrams: 7,
              },
            ],
            title: [
              {
                type: 'autocomplete',
                tokenization: 'edgeGram',
                minGrams: 2,
                maxGrams: 7,
              },
            ],
            description: [
              {
                type: 'autocomplete',
                tokenization: 'edgeGram',
                minGrams: 2,
                maxGrams: 7,
              },
            ],
          },
        },
      });
      if (res.statusCode === 201) {
        logger.info.SERVER_MSG('Created Atlas bookmark_autocomplete index');
      } else {
        logger.error.SERVER_MSG(`Failed to create Atlas bookmark_autocomplete index: ${JSON.stringify(res.data)}`);
      }
    } catch (error) {
      logger.error.SERVER_MSG(`Error creating Atlas bookmark_autocomplete index: ${error}`);
    }
  } else {
    logger.info.SERVER_MSG('Atlas bookmark_autocomplete index already exists');
  }
}

export {
  findAtlasIndexByName,
  upsertAtlasSearchIndex,
  upsertAtlasAutocompleteIndex,
  findBookmarkAtlasIndexByName,
  upsertBookmarkSearchIndex,
  upsertBookmarkAutocompleteIndex,
};
