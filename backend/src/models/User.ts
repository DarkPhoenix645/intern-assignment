import mongoose, { ObjectId } from "mongoose";
import bcrypt from "bcryptjs";

// Define the document interface
interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password: string;
}

// Define the model interface with static methods
interface UserModel extends mongoose.Model<IUser> {
  login(email: string, password: string): Promise<IUser>;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
});

userSchema.statics.login = async function (email, password) {
  const student = await this.findOne({ email });

  try {
    if (student) {
      const auth = await bcrypt.compare(password, student.password);
      if (auth) {
        return student;
      }
      throw new Error("Invalid password");
    } else {
      throw new Error("Student does not exist");
    }
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;
