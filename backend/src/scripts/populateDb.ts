import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import Note, { INote } from '../models/Note';
import Bookmark, { IBookmark } from '../models/Bookmark';

const MONGODB_URI = process.env.MONGODB_HOST || 'mongodb://localhost:27017/test';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Note.deleteMany({});
  await Bookmark.deleteMany({});

  const users: IUser[] = [];
  for (let i = 0; i < 10; i++) {
    const password = await bcrypt.hash('password123', 10);
    const user = new User({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password,
      deactivated: false,
      otp: '',
      otpExpires: 0,
      favorites: { notes: [], bookmarks: [] },
    }) as IUser;
    await user.save();
    users.push(user);
  }

  for (const user of users) {
    // Create notes
    const notes: mongoose.Types.ObjectId[] = [];
    const noteCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < noteCount; i++) {
      const note = new Note({
        user: user._id,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs({ min: 1, max: 3 }),
        tags: faker.helpers.uniqueArray(() => faker.lorem.word(), 3),
        favorite: faker.datatype.boolean(),
        files: [], // No files for seed
      }) as INote;
      await note.save();
      notes.push(note._id as mongoose.Types.ObjectId);
    }
    user.favorites.notes = notes;

    // Create bookmarks
    const bookmarks: mongoose.Types.ObjectId[] = [];
    const bookmarkCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < bookmarkCount; i++) {
      const bookmark = new Bookmark({
        user: user._id,
        url: faker.internet.url(),
        title: faker.lorem.words({ min: 2, max: 5 }),
        description: faker.lorem.sentence(),
        tags: faker.helpers.uniqueArray(() => faker.lorem.word(), 3),
        favorite: faker.datatype.boolean(),
      }) as IBookmark;
      await bookmark.save();
      bookmarks.push(bookmark._id as mongoose.Types.ObjectId);
    }
    user.favorites.bookmarks = bookmarks;
    await user.save();
  }

  console.log('Database populated with fake users, notes, and bookmarks!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
