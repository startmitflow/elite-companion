export class SyncClient {
  private apiUrl: string;
  private apiToken: string;

  constructor(apiUrl: string, apiToken: string) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
  }

  async syncEvents(events: any[]): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/journal/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to sync events: ${error}`);
    }

    const result = await response.json();
    console.log(`Synced ${result.processed} events`);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}