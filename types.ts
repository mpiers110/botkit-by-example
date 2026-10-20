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