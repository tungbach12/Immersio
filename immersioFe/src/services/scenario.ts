import { authService } from "./auth";

export interface ScenarioItem {
  id: string;
  name: string;
  price: number;
  image: string;
  icon?: string;
}

export interface Scenario {
  id: string;
  title: string;
  language: string;
  level: string;
  category: string;
  description: string;
  rating: number;
  users: string;
  duration: string;
  image: string;
  context: string;
  initialMessage: string;
  avatar: string;
  bg: string;
  modes: ("2d" | "ar")[];
  isNavigation?: boolean;
  items?: ScenarioItem[];
}

export interface CorrectionResult {
  corrected: string;
  explanation: string;
}

export interface ChatOutputResponse {
  reply: string;
  correction?: CorrectionResult;
}

export interface FinishSessionResponse {
  feedback: string;
  suggestedFlashcards: { front: string; back: string; explanation?: string }[];
}

const BASE_URL = "http://localhost:5249/api/scenarios";

export const scenarioService = {
  async getScenarios(): Promise<Scenario[]> {
    const response = await authService.fetchWithAuth(BASE_URL);
    if (!response.ok) {
      throw new Error("Failed to load scenarios");
    }
    const data: any[] = await response.json();
    return data.map(this.mapDtoToModel);
  },

  async getScenarioById(id: string): Promise<Scenario> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error("Failed to load scenario details");
    }
    const data = await response.json();
    return this.mapDtoToModel(data);
  },

  async startSession(scenarioId: string): Promise<string> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/sessions/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scenarioId }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Conflict: You might have reached your daily scenario limit. Please check your subscription.");
      }
      throw new Error("Failed to start roleplay session");
    }

    const data = await response.json();
    return data.sessionId;
  },

  async sendMessage(sessionId: string, message: string): Promise<ChatOutputResponse> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/sessions/${sessionId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to send dialogue turn");
    }

    return response.json();
  },

  async finishSession(sessionId: string): Promise<FinishSessionResponse> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/sessions/${sessionId}/finish`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to complete session evaluation");
    }

    return response.json();
  },

  async generateCustomFlashcards(sessionId: string, options: string[]): Promise<{ front: string; back: string; explanation?: string }[]> {
    const response = await authService.fetchWithAuth(`${BASE_URL}/sessions/${sessionId}/flashcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ options }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate custom flashcards");
    }

    return response.json();
  },

  mapDtoToModel(dto: any): Scenario {
    return {
      id: dto.id,
      title: dto.title,
      language: dto.language,
      level: dto.level,
      category: dto.category,
      description: dto.description,
      rating: dto.rating,
      users: dto.rating >= 4.9 ? "New" : "1.2k",
      duration: dto.duration,
      image: dto.imageUrl,
      context: dto.description,
      initialMessage: dto.initialMessage,
      avatar: dto.avatarUrl,
      bg: dto.imageUrl,
      modes: dto.isNavigation ? ["ar"] : ["2d", "ar"],
      isNavigation: dto.isNavigation,
      items: dto.items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.imageUrl,
        icon: item.icon,
      })),
    };
  },
};
