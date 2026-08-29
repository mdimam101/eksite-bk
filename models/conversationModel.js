const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    guestId: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    adminUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userUnreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ guestId: 1, status: 1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
