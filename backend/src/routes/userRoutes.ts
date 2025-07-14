import express, { Router } from "express";
import routes from "@constants/ROUTER_BOOK";
import requireAuth from "@middleware/requireAuth";
// import { loginStudent, sendRegisterRequest } from "@controllers/student";
import multer from "multer";

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
router.post(routes.USER_AUTH.REGISTER.path);
router.post(routes.USER_AUTH.LOGIN.path);
router.post(routes.USER_AUTH.LOGIN_OTP.path);
router.post(routes.USER_AUTH.LOGOUT.path);
router.post(routes.USER_AUTH.FORGOT_PASSWORD.path);
router.post(routes.USER_AUTH.REFRESH_TOKEN.path);

// Notes routes
router.post(routes.NOTES.CREATE.path);
router.get(routes.NOTES.LIST.path);
router.get(routes.NOTES.GET_BY_ID.path);
router.put(routes.NOTES.UPDATE_BY_ID.path);
router.delete(routes.NOTES.DELETE_BY_ID.path);

// Bookmarks routes
router.post(routes.BOOKMARKS.CREATE.path);
router.get(routes.BOOKMARKS.LIST.path);
router.get(routes.BOOKMARKS.GET_BY_ID.path);
router.put(routes.BOOKMARKS.UPDATE_BY_ID.path);
router.delete(routes.BOOKMARKS.DELETE_BY_ID.path);

export default router;
