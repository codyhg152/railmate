import { pgPool } from '../utils/database';
import { TrainJourney, JourneyStatus } from '../types';

export interface SavedJourney {
  id: string;
  userId: string;
  originId: string;
  destinationId: string;
  scheduledDeparture: Date;
  trainNumber?: string;
  operator?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class JourneyService {
  async saveJourney(
    userId: string,
    originId: string,
    destinationId: string,
    scheduledDeparture: Date,
    trainNumber?: string,
    operator?: string
  ): Promise<SavedJourney> {
    const result = await pgPool.query(
      `INSERT INTO journeys (user_id, origin_id, destination_id, scheduled_departure, train_number, operator)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, originId, destinationId, scheduledDeparture, trainNumber || null, operator || null]
    );
    return this.mapJourney(result.rows[0]);
  }

  async getUserJourneys(userId: string): Promise<SavedJourney[]> {
    const result = await pgPool.query(
      'SELECT * FROM journeys WHERE user_id = $1 ORDER BY scheduled_departure DESC',
      [userId]
    );
    return result.rows.map(row => this.mapJourney(row));
  }

  async getJourney(id: string): Promise<SavedJourney | null> {
    const result = await pgPool.query('SELECT * FROM journeys WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapJourney(result.rows[0]);
  }

  async updateJourneyStatus(id: string, status: string): Promise<void> {
    await pgPool.query(
      'UPDATE journeys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );
  }

  async deleteJourney(id: string, userId: string): Promise<void> {
    await pgPool.query(
      'DELETE FROM journeys WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }

  private mapJourney(row: any): SavedJourney {
    return {
      id: row.id,
      userId: row.user_id,
      originId: row.origin_id,
      destinationId: row.destination_id,
      scheduledDeparture: new Date(row.scheduled_departure),
      trainNumber: row.train_number,
      operator: row.operator,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const journeyService = new JourneyService();
