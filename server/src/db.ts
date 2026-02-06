import mysql from 'mysql2/promise';
import { config } from './config.js';

let pool: mysql.Pool | null = null;

export async function getPool(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully');
      connection.release();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  return pool;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
