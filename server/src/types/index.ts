import { Request } from 'express';

export interface User {
  id: number;
  anilist_id: number;
  username: string;
  avatar_url: string | null;
  access_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Ranking {
  id: number;
  user_id: number;
  data: RankingData;
  created_at: Date;
  updated_at: Date;
}

export interface RankingData {
  // This matches the structure stored in localStorage
  [key: string]: unknown;
}

export interface JWTPayload {
  userId: number;
  anilistId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export interface AniListTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AniListUser {
  id: number;
  name: string;
  avatar: {
    large: string;
  };
}
