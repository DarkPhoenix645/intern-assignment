import z from 'zod';

const minTitleLength = 1;
const minContentLength = 1;
const minNoteIdLength = 1;
const minFileIdLength = 1;

const titleMessage = 'Title is required';
const contentMessage = 'Content is required';
const noteIdMessage = 'Note ID is required';
const fileIdMessage = 'File ID is required';

export const NoteCreateDTOValidator = z.object({
  title: z.string().min(minTitleLength, titleMessage),
  content: z.string().min(minContentLength, contentMessage),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
});

export const NoteUpdateDTOValidator = z.object({
  title: z.string().min(minTitleLength, titleMessage),
  content: z.string().min(minContentLength, contentMessage),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  files: z.any().optional(),
});

export const NoteDeleteFileDTOValidator = z.object({
  noteId: z.string().min(minNoteIdLength, noteIdMessage),
  fileId: z.string().min(minFileIdLength, fileIdMessage),
});
