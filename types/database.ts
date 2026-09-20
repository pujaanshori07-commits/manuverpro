export interface Profile {
  id: string;
  nama: string;
  foto_url: string;
  alamat?: string;
  bio?: string;
  pekerjaan?: string;
  pendidikan?: string;
  hobi?: string;
  age?: number;
  gender?: string;
  photos?: string[];
  distance?: number;
  distance_km?: number;
  prompt_question?: string;
  prompt_answer?: string;
  skill_level?: string;
  distance_pref?: string;
  availability?: string[];
  interests?: string[];
  user_sports?: { sports: { nama: string; icon?: string } }[];
  last_active?: string;
  profile_completeness?: number;
  match_score?: number;
  match_percentage?: number;
  domisili?: string;
  height_cm?: number;
  sport_role?: string;
  prompts?: { question_text: string; answer_text: string }[];
  overall_frequency?: string;
  preferred_time?: string;
  home_venue?: string;
  // Fallbacks for older properties
  umur?: number;
  jarak?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  type?: string;
  metadata?: any;
  created_at: string;
}

export interface MatchData {
  matchId: string;
  nama: string;
  foto_url: string | null;
}
