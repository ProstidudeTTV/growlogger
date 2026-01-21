export interface Grow {
  id: string;
  discord_user_id: string;
  start_date: string;
  flower_start_date?: string | null;
  harvest_date?: string | null;
  strain?: string | null;
  germination_method?: string | null;
  pot_size?: string | null;
  current_stage?: string | null;
  is_harvested: boolean;
  wet_weight?: number | null;
  dry_weight?: number | null;
  harvest_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrowUpdate {
  id: string;
  grow_id: string;
  update_date: string;
  pictures: string[];
  environment?: string | null;
  feeding?: string | null;
  growth_stage?: string | null;
  plant_health?: string | null;
  notes?: string | null;
  terpene_smell?: string | null;
  flower_development?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGrowInput {
  discord_user_id: string;
  start_date: string;
  strain?: string;
  germination_method?: string;
  pot_size?: string;
  current_stage?: string;
}

export interface UpdateGrowInput {
  flower_start_date?: string;
  harvest_date?: string;
  strain?: string;
  germination_method?: string;
  pot_size?: string;
  current_stage?: string;
  is_harvested?: boolean;
  wet_weight?: number;
  dry_weight?: number;
  harvest_notes?: string;
}

export interface CreateGrowUpdateInput {
  grow_id: string;
  update_date: string;
  pictures?: string[];
  environment?: string;
  feeding?: string;
  growth_stage?: string;
  plant_health?: string;
  notes?: string;
  terpene_smell?: string;
  flower_development?: string;
}
