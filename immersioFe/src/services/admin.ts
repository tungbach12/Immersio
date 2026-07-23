import { authService, UserDto, API_BASE } from "./auth";

export interface GrowthPoint {
  name: string;
  users: number;
}

export interface SessionPoint {
  name: string;
  sessions: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeSessions: number;
  averageDuration: string;
  revenue: string;
  growthData: GrowthPoint[];
  sessionData: SessionPoint[];
}

export interface PaymentTransactionDto {
  id: string;
  txnRef: string;
  userId: string;
  username: string;
  email: string;
  tier: string;
  billingCycle: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string | null;
}

export interface AiSettings {
  systemPrompt: string;
  grammarSensitivity: number;
  vocabSensitivity: number;
  enableSlang: boolean;
  speedOfSpeech: string;
  llmEndpoint: string;
  llmApiKey: string;
  modelChat: string;
  modelGrammar: string;
  modelFeedback: string;
  modelFlashcard: string;
  modelPhrase: string;
  reasoningEffortChat: string;
  reasoningEffortGrammar: string;
  reasoningEffortFeedback: string;
  reasoningEffortFlashcard: string;
  reasoningEffortPhrase: string;
}

const BASE_URL = `${API_BASE}/api/admin`;
const SCENARIOS_URL = `${API_BASE}/api/scenarios`;

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/stats`);
    if (!response.ok) throw new Error("Failed to fetch admin stats.");
    return response.json();
  },

  async getUsers(): Promise<UserDto[]> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/users`);
    if (!response.ok) throw new Error("Failed to fetch users list.");
    return response.json();
  },

  async getTransactions(): Promise<PaymentTransactionDto[]> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/transactions`);
    if (!response.ok) throw new Error("Failed to fetch payment transactions.");
    return response.json();
  },

  async approveTransaction(id: string): Promise<PaymentTransactionDto> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/transactions/${id}/approve`, {
      method: "POST"
    });
    if (!response.ok) throw new Error("Failed to approve transaction.");
    return response.json();
  },

  async updateUserSubscription(userId: string, tier: string, cycle: string): Promise<UserDto> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/users/${userId}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, billingCycle: cycle })
    });
    if (!response.ok) throw new Error("Failed to update user subscription.");
    return response.json();
  },

  async banUser(userId: string): Promise<void> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/users/${userId}/ban`, {
      method: "POST"
    });
    if (!response.ok) throw new Error("Failed to block user.");
  },

  async getAiSettings(): Promise<AiSettings> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/ai-tuning`);
    if (!response.ok) throw new Error("Failed to fetch AI tuning parameters.");
    return response.json();
  },

  async saveAiSettings(settings: AiSettings): Promise<void> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/ai-tuning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error("Failed to save AI tuning parameters.");
  },

  async createScenario(scenario: any): Promise<any> {
    const response = await authService.fetchWithAuth(SCENARIOS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario)
    });
    if (!response.ok) throw new Error("Failed to create new scenario.");
    return response.json();
  },

  async updateScenario(id: string, scenario: any): Promise<any> {
    const response = await authService.fetchWithAuth(`${SCENARIOS_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario)
    });
    if (!response.ok) throw new Error("Failed to update scenario.");
    return response.json();
  },

  async deleteScenario(id: string): Promise<void> {
    const response = await authService.fetchWithAuth(`${SCENARIOS_URL}/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Failed to delete scenario.");
  },

  async addScenarioItem(scenarioId: string, item: any): Promise<any> {
    const response = await authService.fetchWithAuth(`${SCENARIOS_URL}/${scenarioId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error("Failed to add target item to scenario.");
    return response.json();
  }
};
