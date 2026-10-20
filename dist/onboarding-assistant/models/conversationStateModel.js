import mongoose from "mongoose";
const ConversationStateSchema = new mongoose.Schema({
    waUserId: { type: String, required: true, unique: true, index: true },
    flowId: { type: String, required: true, default: "onboardingBot" },
    flowVersion: { type: Number, required: true, default: 1 },
    currentNodeId: { type: String, required: true, default: "welcome" },
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    retryCount: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        required: true,
        enum: ["active", "escalated", "completed", "abandoned", "handoff"],
        default: "active",
    },
}, { timestamps: true });
export const ConversationStateModel = mongoose.model("ShuruConversationState", ConversationStateSchema);
