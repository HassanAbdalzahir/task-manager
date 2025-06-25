import mongoose, { Document, Schema } from "mongoose";

export interface IWorkspace extends Document {
  name: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId; // CEO who created the workspace
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [100, "Workspace name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Will be set after user creation
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
workspaceSchema.index({ createdBy: 1 });
workspaceSchema.index({ isActive: 1 });
workspaceSchema.index({ name: 1 });

export const Workspace = mongoose.model<IWorkspace>(
  "Workspace",
  workspaceSchema
);
export default Workspace;
