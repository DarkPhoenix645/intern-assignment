import z from 'zod';

const minBookmarkIdLength = 1;
const minUrlLength = 1;
const bookmarkIdMessage = 'Bookmark ID is required';
const urlMessage = 'Invalid URL';

export const BookmarkCreateDTOValidator = z.object({
  url: z.string().min(minUrlLength, urlMessage).url(urlMessage),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

export const BookmarkUpdateDTOValidator = z.object({
  bookmarkId: z.string().min(minBookmarkIdLength, bookmarkIdMessage),
  url: z.string().min(minUrlLength, urlMessage).url(urlMessage).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

export const BookmarkDeleteDTOValidator = z.object({
  bookmarkId: z.string().min(minBookmarkIdLength, bookmarkIdMessage),
});
