import mongoose from 'mongoose';

const statementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileHash: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['PDF', 'CSV'],
      required: true,
    },
    bankName: {
      type: String,
      trim: true,
      default: 'Unknown Bank',
    },
    accountLabel: {
      type: String,
      trim: true,
      default: 'Primary Account',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    openingBalancePaise: {
      type: Number,
      default: null,
    },
    closingBalancePaise: {
      type: Number,
      default: null,
    },
    declaredTotalCreditsPaise: {
      type: Number,
      default: null,
    },
    declaredTotalDebitsPaise: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['PARSING', 'NEEDS_REVIEW', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
    parserVersion: {
      type: String,
      default: '1.0.0',
    },
    warnings: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

statementSchema.index({ userId: 1, createdAt: -1 });
statementSchema.index({ userId: 1, fileHash: 1 });

export const Statement = mongoose.model('Statement', statementSchema);
