const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('elite_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('elite_token', token);
      } else {
        localStorage.removeItem('elite_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async getCurrentUser() {
    return this.request<{ id: string; email: string; display_name: string; commander_name?: string }>('/auth/me');
  }

  async generateApiToken() {
    return this.request<{ token: string }>('/auth/token', {
      method: 'POST',
    });
  }

  // Ships
  async getShips() {
    return this.request<any[]>('/api/ships');
  }

  async getShip(id: string) {
    return this.request<any>(`/api/ships/${id}`);
  }

  async createShip(data: { name: string; shipType: string; loadout: any }) {
    return this.request<any>('/api/ships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShip(id: string, data: Partial<{ name: string; shipType: string; loadout: any; isFavorite: boolean }>) {
    return this.request<any>(`/api/ships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteShip(id: string) {
    return this.request<{ success: boolean }>(`/api/ships/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials
  async getMaterials() {
    return this.request<any[]>('/api/materials');
  }

  async getInventory() {
    return this.request<any[]>('/api/materials/inventory');
  }

  async syncInventory(materials: { name: string; count: number }[]) {
    return this.request<{ success: boolean; updated: number }>('/api/materials/inventory/sync', {
      method: 'POST',
      body: JSON.stringify({ materials }),
    });
  }

  // Missions
  async getMissions(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/api/missions${query}`);
  }

  async createMission(data: { name: string; missionType?: string; targetSystem?: string; reward?: number }) {
    return this.request<any>('/api/missions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMission(id: string, status: string) {
    return this.request<any>(`/api/missions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteMission(id: string) {
    return this.request<{ success: boolean }>(`/api/missions/${id}`, {
      method: 'DELETE',
    });
  }

  // Trading
  async getTradeRoutes(originSystem: string, maxJumpRange?: number) {
    const query = maxJumpRange
      ? `?originSystem=${originSystem}&maxJumpRange=${maxJumpRange}`
      : `?originSystem=${originSystem}`;
    return this.request<any[]>(`/api/trading/routes${query}`);
  }

  async getCommodities() {
    return this.request<string[]>('/api/trading/commodities');
  }

  async searchSystems(q: string) {
    return this.request<string[]>(`/api/trading/systems?q=${encodeURIComponent(q)}`);
  }

  // Colonisation
  async getColonisationProjects(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/api/colonisation/projects${query}`);
  }

  async getColonisationProject(id: string) {
    return this.request<any>(`/api/colonisation/projects/${id}`);
  }

  async createColonisationProject(data: {
    systemName: string;
    projectType: string;
    economyType: string;
    notes?: string;
  }) {
    return this.request<any>('/api/colonisation/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateColonisationProject(id: string, data: { status?: string; progressPercent?: number; notes?: string }) {
    return this.request<any>(`/api/colonisation/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async analyzeSystem(systemName: string, bodies: any[]) {
    return this.request<{ systemName: string; recommendations: any[] }>('/api/colonisation/analyze', {
      method: 'POST',
      body: JSON.stringify({ systemName, bodies }),
    });
  }

  async getBuildRequirements(projectType: string) {
    return this.request<{ materials: { name: string; amount: number }[] }>(
      `/api/colonisation/requirements/${projectType}`
    );
  }

  async getEconomyRecommendations(systemName: string) {
    return this.request<any[]>(`/api/colonisation/economy-recommendations/${systemName}`);
  }

  // Exploration
  async getExplorationStats() {
    return this.request<any>('/api/exploration/stats');
  }

  async getDiscoveries(limit?: number, offset?: number) {
    const query = limit ? `?limit=${limit}${offset ? `&offset=${offset}` : ''}` : '';
    return this.request<any[]>(`/api/exploration/discoveries${query}`);
  }

  // Journal
  async syncJournalEvents(events: any[]) {
    return this.request<{ success: boolean; processed: number }>('/api/journal/events', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }
}

export const api = new ApiClient(API_URL);