// ============================================================================
// MONGOOSE PERSISTENCE
// ============================================================================

import { ConversationStateModel } from "../models/conversationStateModel.js";
import { IConversationState } from "../bots/onboarding-assistant/types.js";


export const Persistence = {
  async load(waUserId: string): Promise<IConversationState | null> {
      const doc = await ConversationStateModel.findOne({ waUserId }).lean();
      if (!doc) return null;
      return {
        waUserId: doc.waUserId,
        flowId: doc.flowId,
        flowVersion: doc.flowVersion,
        currentNodeId: doc.currentNodeId,
        context: doc.context || {},
        retryCount: doc.retryCount || 0,
        status: doc.status || "active",
        updatedAt: doc.updatedAt || new Date(),
      };
  },

  async save(state: IConversationState): Promise<void> {
    state.updatedAt = new Date();
      await ConversationStateModel.findOneAndUpdate(
        { waUserId: state.waUserId },
        { $set: state },
        { upsert: true, returnDocument: "after" }
      );
      return;
  },

  async reset(waUserId: string): Promise<void> {
    await ConversationStateModel.deleteOne({ waUserId });
  },
};