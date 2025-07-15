import mongoose from 'mongoose';

export type NoteFileType = 'IMAGE' | 'AUDIO' | 'DOCUMENT';

export interface INoteFile {
  id: string; // unique identifier for referencing in markdown (e.g., file_abc123)
  publicId: string; // Cloudinary public ID
  url: string; // Cloudinary URL
  type: NoteFileType; // IMAGE, AUDIO, DOCUMENT
  name?: string; // original filename
  size?: number; // file size in bytes
}

export interface INote extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  title: string;
  content: string; // markdown text, can reference files as ![](file:file_abc123)
  tags: string[];
  favorite: boolean;
  files: INoteFile[];
  createdAt: Date;
  updatedAt: Date;
}

const noteFileSchema = new mongoose.Schema<INoteFile>(
  {
    id: { type: String, required: true },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['IMAGE', 'AUDIO', 'DOCUMENT'],
      required: true,
    },
    name: { type: String },
    size: { type: Number },
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema<INote>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String, index: true }],
    favorite: { type: Boolean, default: false },
    files: { type: [noteFileSchema], default: [] },
  },
  { timestamps: true },
);

const Note = mongoose.model<INote>('Note', noteSchema);
export default Note;
