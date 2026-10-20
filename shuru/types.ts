export interface IConversationState {
    waUserId: string;
    flowId: string;
    flowVersion: number;
    currentNodeId: string;
    context: Record<string, any>;
    retryCount: number;
    status: "active" | "escalated" | "completed" | "abandoned" | "handoff";
    updatedAt: Date;
  }
export interface TransitionOutcome {
  outboundText: string;
  nextState: IConversationState;
}