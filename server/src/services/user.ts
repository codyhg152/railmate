import { pgPool } from '../utils/database';
import { PushToken, User } from '../types';

export class UserService {
  async createUser(email?: string): Promise<User> {
    const result = await pgPool.query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [email || null]
    );
    return this.mapUser(result.rows[0]);
  }

  async getUser(id: string): Promise<User | null> {
    const result = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapUser(result.rows[0]);
  }

  async registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<PushToken> {
    const result = await pgPool.query(
      `INSERT INTO push_tokens (user_id, token, platform) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, token) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP, platform = $3
       RETURNING *`,
      [userId, token, platform]
    );
    return this.mapPushToken(result.rows[0]);
  }

  async getUserPushTokens(userId: string): Promise<PushToken[]> {
    const result = await pgPool.query(
      'SELECT * FROM push_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => this.mapPushToken(row));
  }

  async deletePushToken(userId: string, token: string): Promise<void> {
    await pgPool.query(
      'DELETE FROM push_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
  }

  private mapUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapPushToken(row: Record<string, unknown>): PushToken {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      token: row.token as string,
      platform: row.platform as 'ios' | 'android' | 'web',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

export const userService = new UserService();
