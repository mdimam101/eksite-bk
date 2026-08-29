const mongoose = require("mongoose");

const websocketConnectionSchema = new mongoose.Schema(
  {
    connectionId: {
      type: String,
      required: true,
      unique: true,
    },
    connectionType: {
      type: String,
      enum: ["GUEST", "USER", "ADMIN"],
      required: true,
    },
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
    endpoint: {
      type: String,
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

websocketConnectionSchema.index({ connectionType: 1, userId: 1 });
websocketConnectionSchema.index({ connectionType: 1, guestId: 1 });

module.exports = mongoose.model("WebsocketConnection", websocketConnectionSchema);
