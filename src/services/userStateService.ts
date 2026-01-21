/**
 * User state management for multi-step commands
 */

interface UserState {
  command: string;
  growId?: string;
  step: number;
  data: Record<string, any>;
  channelId?: string; // Track original channel for sending summaries and clearing messages
  createdAt: number;
}

const userStates = new Map<string, UserState>();

const STATE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * Set user state for multi-step command
 */
export function setUserState(userId: string, state: Omit<UserState, 'createdAt'>): void {
  userStates.set(userId, {
    ...state,
    createdAt: Date.now(),
  });
}

/**
 * Get user state
 */
export function getUserState(userId: string): UserState | null {
  const state = userStates.get(userId);
  
  if (!state) {
    return null;
  }

  // Check if state has expired
  if (Date.now() - state.createdAt > STATE_TIMEOUT) {
    userStates.delete(userId);
    return null;
  }

  return state;
}

/**
 * Clear user state
 */
export function clearUserState(userId: string): void {
  userStates.delete(userId);
}

/**
 * Update user state data
 */
export function updateUserState(userId: string, updates: Partial<UserState>): void {
  const state = getUserState(userId);
  if (state) {
    userStates.set(userId, {
      ...state,
      ...updates,
      createdAt: Date.now(), // Reset timeout
    });
  }
}

/**
 * Clean up expired states
 */
export function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [userId, state] of userStates.entries()) {
    if (now - state.createdAt > STATE_TIMEOUT) {
      userStates.delete(userId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredStates, 5 * 60 * 1000);
