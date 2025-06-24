import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "CEO" | "Manager" | "Employee";
  managerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["CEO", "Manager", "Employee"],
      required: [true, "Role is required"],
      default: "Employee",
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IUser) {
        // CEO doesn't have a manager
        return this.role !== "CEO";
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for getting direct subordinates
userSchema.virtual("directSubordinates", {
  ref: "User",
  localField: "_id",
  foreignField: "managerId",
});

// Virtual for getting all subordinates (recursive)
userSchema.virtual("allSubordinates", {
  ref: "User",
  localField: "_id",
  foreignField: "managerId",
});

export const User = mongoose.model<IUser>("User", userSchema);
export default User;
