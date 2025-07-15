import mongoose, { ObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import { boolean, number } from 'zod';

// Define the document interface
export interface IUser extends mongoose.Document {
  name: string;
  deactivated: boolean;
  email: string;
  password: string;
  otp: string;
  otpExpires: number;
  favorites: {
    notes: mongoose.Types.ObjectId[];
    bookmarks: mongoose.Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the model interface with static methods
export interface UserModel extends mongoose.Model<IUser> {
  login(email: string, password: string): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    deactivated: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Number },
    email: {
      type: String,
      unique: true,
      required: true,
      validate: {
        validator: (v: string) => /.+@.+\..+/.test(v),
        message: (props: any) => `${props.value} is not a valid email!`,
      },
    },
    password: { type: String, required: true },
    favorites: {
      notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
      bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bookmark' }],
    },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
