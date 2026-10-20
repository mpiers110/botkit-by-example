// ============================================================================
// TYPES & CONVERSATION STATE SPECIFICATION
// ============================================================================
export interface AppointmentContext {
  patientName?: string;
  service?: string;
  doctor?: string;
  date?: string;
  timeSlot?: string;
  bookingId?: string;
  bookingTimestamp?: number;
  phone?: string;
}

export interface IAppointmentState {
  waUserId: string;
  flowId: string;
  flowVersion: number;
  currentNodeId: string;
  context: AppointmentContext;
  retryCount: number;
  status: "active" | "completed" | "cancelled" | "handoff";
  lastInboundText?: string;
  lastTransitionAt: Date;
  updatedAt: Date;
}

export interface TransitionOutcome {
  outboundText: string;
  nextState: IAppointmentState;
  hasTransitioned: boolean;
}
export interface FlowTransition {
  patterns: string[];
  targetNodeId: string;
  onMatch?: (input: string, context: AppointmentContext) => void;
}

export interface FlowNode {
  id: string;
  renderText: (context: AppointmentContext) => string;
  transitions: FlowTransition[];
  fallbackText: string;
  maxRetries: number;
}