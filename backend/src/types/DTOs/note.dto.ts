export interface NoteCreateDTO {
  title: string;
  content: string;
  tags?: string[];
  favorite?: boolean;
}

export interface NoteUpdateDTO {
  noteId: string;
  title: string;
  content: string;
  tags?: string[];
  favorite?: boolean;
  files?: any[]; // Accept new files to add, do not remove existing
}

export interface NoteDeleteFileDTO {
  noteId: string;
  fileId: string;
}
