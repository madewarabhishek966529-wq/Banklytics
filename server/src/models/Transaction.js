import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    statementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Statement',
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    amountPaise: {
      type: Number,
      required: true,
      min: [0, 'Amount must be a non-negative integer in paise'],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    direction: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    balancePaise: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      default: 'Other / Needs Review',
      trim: true,
    },
    classification: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'TRANSFER', 'REFUND', 'OTHER'],
      default: 'OTHER',
    },
    counterparty: {
      type: String,
      trim: true,
      default: '',
    },
    fingerprint: {
      type: String,
      index: true,
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1.0,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    sourcePage: {
      type: Number,
      default: 1,
    },
    sourceRow: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, statementId: 1, transactionDate: 1 });
transactionSchema.index({ userId: 1, fingerprint: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
