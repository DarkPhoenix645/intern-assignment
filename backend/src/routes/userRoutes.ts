import express, { Router } from 'express';
import routes from '@constants/ROUTER_BOOK';
import { requireAuth } from '@middleware/requireAuth';
import multer from 'multer';
import {
  generateOTP,
  generateResetOTP,
  loginUser,
  processOTPLogin,
  refreshTokenHandler,
  registerUser,
  resetPassword,
} from '@controllers/userController';
import {
  autocompleteNoteSearch,
  createNote,
  deleteFile,
  deleteNote,
  getNote,
  searchNote,
  updateNote,
} from '@controllers/notesController';
import {
  createBookmark,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  searchBookmark,
  autocompleteBookmarkSearch,
} from '@controllers/bookmarksController';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router: Router = express.Router();

/* Some info:
Decided to not use the path methods from the ROUTER_BOOK.ts file for better readability, the path methods are 
still documented in the ROUTER_BOOK.ts file for reference
*/

// Auth routes
router.post(routes.USER_AUTH.REGISTER.path, registerUser);
router.post(routes.USER_AUTH.LOGIN.path, loginUser);
router.post(routes.USER_AUTH.GEN_OTP.path, generateOTP);
router.post(routes.USER_AUTH.LOGIN_OTP.path, processOTPLogin);
router.post(routes.USER_AUTH.GEN_RESET_OTP.path, generateResetOTP);
router.post(routes.USER_AUTH.RESET_PASSWORD.path, resetPassword);
router.post(routes.USER_AUTH.REFRESH_TOKEN.path, refreshTokenHandler);

// Notes routes
// Supports upto 10 file uploads per note
router.post(routes.NOTES.CREATE.path, requireAuth, upload.array('files', 10), createNote);
router.get(routes.NOTES.LIST.path, requireAuth, searchNote);
router.get(routes.NOTES.AUTOCOMPLETE.path, requireAuth, autocompleteNoteSearch);
router.get(routes.NOTES.GET_BY_ID.path, requireAuth, getNote);
router.put(routes.NOTES.UPDATE_BY_ID.path, requireAuth, upload.array('files', 10), updateNote);
router.delete(routes.NOTES.DELETE_FILE_FROM_NOTE.path, requireAuth, deleteFile);
router.delete(routes.NOTES.DELETE_BY_ID.path, requireAuth, deleteNote);

// Bookmarks routes
router.post(routes.BOOKMARKS.CREATE.path, requireAuth, createBookmark);
router.get(routes.BOOKMARKS.LIST.path, requireAuth, searchBookmark);
router.get(routes.BOOKMARKS.AUTOCOMPLETE.path, requireAuth, autocompleteBookmarkSearch);
router.get(routes.BOOKMARKS.GET_BY_ID.path, requireAuth, getBookmark);
router.put(routes.BOOKMARKS.UPDATE_BY_ID.path, requireAuth, updateBookmark);
router.delete(routes.BOOKMARKS.DELETE_BY_ID.path, requireAuth, deleteBookmark);

export default router;
