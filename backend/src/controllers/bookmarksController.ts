import { RequestWithUser } from '@middleware/requireAuth';
import { NextFunction, Response } from 'express';
import Bookmark from '@models/Bookmark';
import { NotFoundError, ServerError, UserError } from '@custom-types/errorResponses';
import successHandler from '@middleware/successHandler';
import SuccessResponse from '@custom-types/successResponses';
import ogs from 'open-graph-scraper';
import logger from '@utils/logger';
import { BookmarkCreateDTOValidator, BookmarkUpdateDTOValidator } from '@custom-types/DTOs/bookmarkDTOValidator';

// Create Bookmark
const createBookmark = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const validation = BookmarkCreateDTOValidator.safeParse(req.body);
    if (!validation.success) {
      return next(new UserError(validation.error.message));
    }
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    let { url, title, description, tags = [], favorite = false } = validation.data;
    // Auto-fetch metadata if title or description missing
    if (!title || !description) {
      try {
        const { result } = await ogs({ url });
        if (!title && result.ogTitle) title = result.ogTitle as string;
        if (!description && result.ogDescription) description = result.ogDescription as string;
      } catch (err) {
        logger.error.SERVER_ERR(`Failed to fetch OG metadata: ${err}`);
      }
    }
    // Ensure required fields have values
    if (!title) title = 'Untitled Bookmark';
    if (!description) description = 'No description';
    const bookmark = new Bookmark({
      user: req.userObj._id,
      url,
      title,
      description,
      tags,
      favorite,
    });
    await bookmark.save();
    successHandler(new SuccessResponse('Bookmark created successfully', '201'), res, { bookmark });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to create bookmark: ${err}`);
    next(new ServerError('Failed to create bookmark.'));
  }
};

// Get bookmark by ID
const getBookmark = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const bookmarkId = (req.params as any).id;
    if (!bookmarkId) {
      return next(new UserError('Bookmark ID is a required field'));
    }
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: req.userObj._id });
    if (!bookmark) {
      return next(new NotFoundError('Bookmark not found'));
    }
    successHandler(new SuccessResponse('Bookmark fetched successfully', '200'), res, { bookmark });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to fetch bookmark: ${err}`);
    next(new ServerError('Failed to fetch bookmark.'));
  }
};

// Update bookmark
const updateBookmark = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const validation = BookmarkUpdateDTOValidator.safeParse(req.body);
    if (!validation.success) {
      return next(new UserError(validation.error.message));
    }
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const { url, title, description, tags, favorite } = validation.data;

    const bookmarkId = (req.params as any).id;
    if (!bookmarkId) {
      return next(new UserError('Bookmark ID is a required field'));
    }
    const bookmark = await Bookmark.findOne({ _id: bookmarkId, user: req.userObj._id });
    if (!bookmark) {
      return next(new NotFoundError('Bookmark not found'));
    }
    // If title/description missing and url is updated, fetch OG
    let newTitle = title;
    let newDescription = description;
    if ((!title || !description) && url) {
      try {
        const { result } = await ogs({ url });
        if (!title && result.ogTitle) newTitle = result.ogTitle as string;
        if (!description && result.ogDescription) newDescription = result.ogDescription as string;
      } catch (err) {
        logger.error.SERVER_ERR(`Failed to fetch OG metadata: ${err}`);
      }
    }
    if (url) bookmark.url = url;
    if (newTitle) bookmark.title = newTitle;
    if (newDescription) bookmark.description = newDescription;
    if (tags) bookmark.tags = tags;
    if (typeof favorite === 'boolean') bookmark.favorite = favorite;
    await bookmark.save();
    successHandler(new SuccessResponse('Bookmark updated successfully', '200'), res, { bookmark });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to update bookmark: ${err}`);
    next(new ServerError('Failed to update bookmark.'));
  }
};

// Delete bookmark
const deleteBookmark = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const bookmarkId = (req.params as any).id;
    if (!bookmarkId) {
      return next(new UserError('Bookmark ID is a required field'));
    }
    const bookmark = await Bookmark.findOneAndDelete({ _id: bookmarkId, user: req.userObj._id });
    if (!bookmark) {
      return next(new NotFoundError('Bookmark not found'));
    }
    successHandler(new SuccessResponse('Bookmark deleted successfully', '200'), res, { bookmark });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to delete bookmark: ${err}`);
    next(new ServerError('Failed to delete bookmark.'));
  }
};

// Search bookmarks with Atlas Search (full-text, fuzzy, tags filter)
const searchBookmark = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const searchQuery = (req.query.q as string) || '';
    // Parse tags as array of strings
    let tags: string[] = [];
    if (req.query.tags) {
      if (Array.isArray(req.query.tags)) {
        tags = req.query.tags as string[];
      } else {
        tags = (req.query.tags as string)
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
      }
    }
    if (!searchQuery || searchQuery.length < 2) {
      const result = await Bookmark.find({ user: req.userObj._id });
      successHandler(new SuccessResponse('Successfully fetched matching bookmarks', '200'), res, { result });
      return;
    }
    const pipeline: any[] = [];
    if (tags.length > 0) {
      pipeline.push({
        $search: {
          index: 'bookmark_search',
          text: {
            query: searchQuery,
            path: ['url', 'title', 'description'],
            fuzzy: {},
          },
        },
      });
      pipeline.push({ $match: { user: req.userObj._id, tags: { $all: tags } } });
    } else {
      pipeline.push({
        $search: {
          index: 'bookmark_search',
          text: {
            query: searchQuery,
            path: ['url', 'title', 'description'],
            fuzzy: {},
          },
        },
      });
      pipeline.push({ $match: { user: req.userObj._id } });
    }
    pipeline.push({
      $project: {
        _id: 1,
        url: 1,
        title: 1,
        description: 1,
        tags: 1,
        favorite: 1,
        createdAt: 1,
        updatedAt: 1,
        score: { $meta: 'searchScore' },
      },
    });
    pipeline.push({ $sort: { score: -1, updatedAt: -1 } });
    pipeline.push({ $limit: 10 });
    const result = await Bookmark.aggregate(pipeline);
    successHandler(new SuccessResponse('Successfully fetched matching bookmarks', '200'), res, { result });
    return;
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to search bookmarks: ${err}`);
    next(new ServerError('Failed to search bookmarks.'));
  }
};

// Autocomplete bookmarks using Atlas Search
// Not functional in the final code as Atlas has a limit of 3 search indexes per M0 cluster
const autocompleteBookmarkSearch = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const searchQuery = (req.query.q as string) || '';
    if (!searchQuery || searchQuery.length < 1) {
      return res.json([]);
    }
    const pipeline: any[] = [
      {
        $search: {
          index: 'bookmark_search',
          compound: {
            should: [
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'url',
                  tokenOrder: 'sequential',
                  fuzzy: {},
                },
              },
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'title',
                  tokenOrder: 'sequential',
                  fuzzy: {},
                },
              },
              {
                autocomplete: {
                  query: searchQuery,
                  path: 'description',
                  tokenOrder: 'sequential',
                  fuzzy: {},
                },
              },
            ],
          },
        },
      },
      { $match: { user: req.userObj._id } },
      {
        $project: {
          _id: 1,
          url: 1,
          title: 1,
          description: 1,
          score: { $meta: 'searchScore' },
        },
      },
      { $sort: { score: -1, title: 1 } },
      { $limit: 10 },
    ];
    const result = await Bookmark.aggregate(pipeline);
    return res.json(result);
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to autocomplete bookmarks: ${err}`);
    next(new ServerError('Failed to autocomplete bookmarks.'));
  }
};

export { createBookmark, getBookmark, updateBookmark, deleteBookmark, searchBookmark, autocompleteBookmarkSearch };
