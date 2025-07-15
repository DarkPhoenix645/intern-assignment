import { RequestWithUser } from '@middleware/requireAuth';
import { NextFunction, Response } from 'express';
import Note, { INoteFile, NoteFileType } from '@models/Note';
import { NotFoundError, ServerError, UserError } from '@custom-types/errorResponses';
import successHandler from '@middleware/successHandler';
import SuccessResponse from '@custom-types/successResponses';
import cloudinary from 'cloudinary';
import logger from '@utils/logger';
import {
  NoteCreateDTOValidator,
  NoteUpdateDTOValidator,
  NoteDeleteFileDTOValidator,
} from '@custom-types/DTOs/noteDTOValidator';

const createNote = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    // Coerce 'favorite' to boolean if present as string
    if (req.body && typeof req.body === 'object' && 'favorite' in req.body && typeof req.body.favorite === 'string') {
      req.body.favorite = req.body.favorite === 'true';
    }
    // Ensure 'tags' is always an array
    if (
      req.body &&
      typeof req.body === 'object' &&
      'tags' in req.body &&
      req.body.tags &&
      !Array.isArray(req.body.tags)
    ) {
      req.body.tags = [req.body.tags];
    }
    const validation = NoteCreateDTOValidator.safeParse(req.body);
    if (!validation.success) {
      return next(new UserError(validation.error.message));
    }
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const { title, content, tags = [], favorite = false } = validation.data;
    if (!title || !content) {
      return next(new UserError('Title and content are required fields'));
    }

    let noteFiles: INoteFile[] = [];

    // Handle file uploads if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Check for unsupported file types before uploading
      for (const file of req.files) {
        const mainType = file.mimetype.split('/')[0];
        if (!(mainType === 'image' || mainType === 'audio' || file.mimetype === 'application/pdf')) {
          return next(new UserError('Only image, audio, and PDF files are allowed.'));
        }
      }

      // Upload each file buffer to Cloudinary
      const uploadPromises = req.files.map((file: any) => {
        return new Promise((resolve, reject) => {
          const mainType = file.mimetype.split('/')[0];
          let noteFileType: NoteFileType;
          if (mainType === 'image') noteFileType = 'IMAGE';
          else if (mainType === 'audio') noteFileType = 'AUDIO';
          else if (file.mimetype === 'application/pdf') noteFileType = 'DOCUMENT';
          else return reject(new UserError('Only image, audio, and PDF files are allowed.'));
          const stream = cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, (error: any, result: any) => {
            if (error) return reject(error);
            resolve({
              id: `file_${Math.random().toString(36).slice(2, 11)}`,
              publicId: result.public_id,
              url: result.secure_url,
              type: noteFileType,
              name: file.originalname,
              size: file.size,
            });
          });
          stream.end(file.buffer);
        });
      });
      noteFiles = (await Promise.all(uploadPromises)) as INoteFile[];
    }

    const note = new Note({
      user: req.userObj._id,
      title,
      content,
      tags,
      favorite,
      files: noteFiles,
    });
    await note.save();
    successHandler(new SuccessResponse('Note created successfully', '201'), res, { note });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to create note: ${err}`);
    next(new ServerError('Failed to create note.'));
  }
};

const getNote = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const noteId = (req.params as any).id;
    if (!noteId) {
      return next(new UserError('Note ID is a required field'));
    }
    const note = await Note.findOne({ _id: noteId, user: req.userObj._id });
    if (!note) {
      return next(new NotFoundError('Note not found'));
    }
    successHandler(new SuccessResponse('Note fetched successfully', '200'), res, { note });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to fetch note: ${err}`);
    next(new ServerError('Failed to fetch note.'));
  }
};

const updateNote = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    // Coerce 'favorite' to boolean if present as string
    if (req.body && typeof req.body === 'object' && 'favorite' in req.body && typeof req.body.favorite === 'string') {
      req.body.favorite = req.body.favorite === 'true';
    }
    // Ensure 'tags' is always an array
    if (
      req.body &&
      typeof req.body === 'object' &&
      'tags' in req.body &&
      req.body.tags &&
      !Array.isArray(req.body.tags)
    ) {
      req.body.tags = [req.body.tags];
    }
    const validation = NoteUpdateDTOValidator.safeParse(req.body);
    if (!validation.success) {
      return next(new UserError(validation.error.message));
    }
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated', '403'));
    }
    const noteId = (req.params as any).id;
    const { title, content, tags = [], favorite = false } = validation.data;
    if (!noteId) {
      return next(new UserError('Note ID is a required field'));
    }
    const note = await Note.findOne({ _id: noteId, user: req.userObj._id });
    if (!note) {
      return next(new NotFoundError('Note not found'));
    }

    // Handle new file uploads (if any)
    let newFiles: INoteFile[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const mainType = file.mimetype.split('/')[0];
        if (!(mainType === 'image' || mainType === 'audio' || file.mimetype === 'application/pdf')) {
          return next(new UserError('Only image, audio, and PDF files are allowed.'));
        }
      }
      const uploadPromises = req.files.map((file: any) => {
        return new Promise((resolve, reject) => {
          const mainType = file.mimetype.split('/')[0];
          let noteFileType: NoteFileType;
          if (mainType === 'image') noteFileType = 'IMAGE';
          else if (mainType === 'audio') noteFileType = 'AUDIO';
          else if (file.mimetype === 'application/pdf') noteFileType = 'DOCUMENT';
          else return reject(new UserError('Only image, audio, and PDF files are allowed.'));
          const stream = cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, (error: any, result: any) => {
            if (error) return reject(error);
            resolve({
              id: `file_${Math.random().toString(36).slice(2, 11)}`,
              publicId: result.public_id,
              url: result.secure_url,
              type: noteFileType,
              name: file.originalname,
              size: file.size,
            });
          });
          stream.end(file.buffer);
        });
      });
      newFiles = (await Promise.all(uploadPromises)) as INoteFile[];
    }
    // Merge new files with existing
    note.title = title;
    note.content = content;
    note.tags = tags;
    note.favorite = favorite;
    note.files = [...note.files, ...newFiles];
    await note.save();
    successHandler(new SuccessResponse('Note updated successfully', '200'), res, { note });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to update note: ${err}`);
    next(new ServerError('Failed to update note.'));
  }
};

const deleteFile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const validation = NoteDeleteFileDTOValidator.safeParse(req.body);
    if (!validation.success) {
      return next(new UserError(validation.error.message));
    }
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.'));
    }
    const { noteId, fileId } = validation.data;
    if (!noteId || !fileId) {
      return next(new UserError('noteId and fileId are required.'));
    }
    const note = await Note.findOne({ _id: noteId, user: req.userObj._id });
    if (!note) {
      return next(new UserError('Note not found.'));
    }
    const fileToDelete = note.files.find((f) => f.id === fileId);
    if (!fileToDelete) {
      return next(new UserError('File not found in note.'));
    }
    // Remove from Cloudinary
    await cloudinary.v2.uploader.destroy(fileToDelete.publicId, { resource_type: 'auto' });
    // Remove from note
    note.files = note.files.filter((f) => f.id !== fileId);
    await note.save();
    successHandler(new SuccessResponse('File deleted successfully', '200'), res, { note });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to delete file: ${err}`);
    next(new ServerError('Failed to delete file.'));
  }
};

const deleteNote = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const noteId = (req.params as any).id;
    if (!noteId) {
      return next(new UserError('Note ID is a required field'));
    }
    const note = await Note.findOneAndDelete({ _id: noteId, user: req.userObj._id });
    if (!note) {
      return next(new NotFoundError('Note not found'));
    }
    successHandler(new SuccessResponse('Note deleted successfully', '200'), res, { note });
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to delete note: ${err}`);
    next(new ServerError('Failed to delete note.'));
  }
};

// Search notes with Atlas Search (full-text, fuzzy, tags filter)
const searchNote = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.userObj || !req.userObj._id) {
      return next(new UserError('User not authenticated.', '403'));
    }
    const searchQuery = (req.query.q as string) || '';
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
    const hasTags = tags.length > 0 && tags[0] !== '';

    if ((!searchQuery || searchQuery.length < 2) && hasTags) {
      // Only tags filter, no search query
      const result = await Note.find({ user: req.userObj._id, tags: { $all: tags } });
      successHandler(new SuccessResponse('Successfully fetched matching notes', '200'), res, { result });
      return;
    }

    if (!searchQuery || searchQuery.length < 2) {
      // No search query, no tags
      const result = await Note.find({ user: req.userObj._id });
      successHandler(new SuccessResponse('Successfully fetched matching notes', '200'), res, { result });
      return;
    }

    const pipeline: any[] = [];
    // Compound search if tags are present
    if (hasTags) {
      pipeline.push({
        $search: {
          index: 'note_search',
          text: {
            query: searchQuery,
            path: ['title', 'content'],
            fuzzy: {},
          },
        },
      });
      pipeline.push({ $match: { user: req.userObj._id, tags: { $all: tags } } });
    } else {
      pipeline.push({
        $search: {
          index: 'note_search',
          text: {
            query: searchQuery,
            path: ['title', 'content'],
            fuzzy: {},
          },
        },
      });
      pipeline.push({ $match: { user: req.userObj._id } });
    }
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        tags: 1,
        favorite: 1,
        files: 1,
        createdAt: 1,
        updatedAt: 1,
        score: { $meta: 'searchScore' },
      },
    });
    pipeline.push({ $sort: { score: -1, updatedAt: -1 } });
    pipeline.push({ $limit: 10 });
    const result = await Note.aggregate(pipeline);
    successHandler(new SuccessResponse('Successfully fetched matching notes', '200'), res, { result });
    return;
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to search notes: ${err}`);
    next(new ServerError('Failed to search notes.'));
  }
};

// Autocomplete note titles using Atlas Search
const autocompleteNoteSearch = async (req: RequestWithUser, res: Response, next: NextFunction) => {
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
          index: 'note_autocomplete',
          autocomplete: {
            query: searchQuery,
            path: 'title',
            tokenOrder: 'sequential',
            fuzzy: {},
          },
        },
      },
      { $match: { user: req.userObj._id } },
      {
        $project: {
          _id: 1,
          title: 1,
          score: { $meta: 'searchScore' },
        },
      },
      { $sort: { score: -1, title: 1 } },
      { $limit: 10 },
    ];
    const result = await Note.aggregate(pipeline);
    return res.json(result);
  } catch (err) {
    logger.error.SERVER_ERR(`Failed to autocomplete notes: ${err}`);
    next(new ServerError('Failed to autocomplete notes.'));
  }
};

export { createNote, getNote, updateNote, deleteFile, deleteNote, searchNote, autocompleteNoteSearch };
