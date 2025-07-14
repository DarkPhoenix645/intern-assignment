import mongoose from "mongoose";

export interface IBookmark extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  favorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d-]+(:\d+)?(\/.*)?$/i;

const bookmarkSchema = new mongoose.Schema<IBookmark>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => urlRegex.test(v),
        message: (props: any) => `${props.value} is not a valid URL!`,
      },
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String, index: true }],
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Text index for search
bookmarkSchema.index({
  title: "text",
  description: "text",
  url: "text",
  tags: 1,
});

const Bookmark = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
export default Bookmark;
