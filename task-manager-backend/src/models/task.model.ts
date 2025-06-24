import mongoose, { Document, Schema } from "mongoose";

export interface IComment {
  message: string;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

export interface ITask extends Document {
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  assignedTo: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  deadline?: Date;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  message: {
    type: String,
    required: [true, "Comment message is required"],
    trim: true,
    maxlength: [1000, "Comment cannot exceed 1000 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned user is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (this: ITask, value: Date) {
          if (value && value <= new Date()) {
            return false;
          }
          return true;
        },
        message: "Deadline must be in the future",
      },
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual for checking if task is overdue
taskSchema.virtual("isOverdue").get(function (this: ITask): boolean {
  if (!this.deadline) return false;
  return this.status !== "completed" && new Date() > this.deadline;
});

// Ensure virtuals are included in JSON output
taskSchema.set("toJSON", { virtuals: true });

export const Task = mongoose.model<ITask>("Task", taskSchema);
export default Task;
