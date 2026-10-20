export interface BotkitNode {
  id: string;
  text: string;
  transitions: Array<{
    patterns: string[];
    targetNodeId: string;
    description?: string;
  }>;
  fallbackText: string;
  maxRetries: number;
  onEnter?: (context: Record<string, any>, waUserId: string) => Promise<string | void> | string | void;
}

export interface BotkitGlobal {
  id: string;
  patterns: string[];
  targetNodeId: string;
  description: string;
}

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