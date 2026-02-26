import mongoose, { Schema, Document, Types } from 'mongoose';

export type QuestionStatus = 'active' | 'solved' | 'expired';

export interface IQuestion extends Document {
  expression: string;
  answer: number;
  status: QuestionStatus;
  solvedBy: Types.ObjectId | null;
  solvedAt: Date | null;
  createdAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    expression: {
      type: String,
      required: true,
    },
    answer: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'solved', 'expired'],
      default: 'active',
      required: true,
    },
    solvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ status: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
