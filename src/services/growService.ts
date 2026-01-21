import { supabase } from './supabase.js';
import type {
  Grow,
  GrowUpdate,
  CreateGrowInput,
  UpdateGrowInput,
  CreateGrowUpdateInput,
} from '../types/grow.js';

export class GrowService {
  /**
   * Get all grows for a Discord user
   */
  static async getGrowsByUserId(discordUserId: string): Promise<Grow[]> {
    const { data, error } = await supabase
      .from('grows')
      .select('*')
      .eq('discord_user_id', discordUserId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch grows: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get ongoing (non-harvested) grows for a Discord user
   */
  static async getOngoingGrows(discordUserId: string): Promise<Grow[]> {
    const { data, error } = await supabase
      .from('grows')
      .select('*')
      .eq('discord_user_id', discordUserId)
      .eq('is_harvested', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ongoing grows: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single grow by ID
   */
  static async getGrowById(id: string): Promise<Grow | null> {
    const { data, error } = await supabase
      .from('grows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch grow: ${error.message}`);
    }

    return data;
  }

  /**
   * Get active grow for a Discord user (first ongoing grow)
   */
  static async getActiveGrow(discordUserId: string): Promise<Grow | null> {
    const ongoingGrows = await this.getOngoingGrows(discordUserId);
    return ongoingGrows.length > 0 ? ongoingGrows[0] : null;
  }

  /**
   * Count ongoing grows for a Discord user
   */
  static async countOngoingGrows(discordUserId: string): Promise<number> {
    const { count, error } = await supabase
      .from('grows')
      .select('*', { count: 'exact', head: true })
      .eq('discord_user_id', discordUserId)
      .eq('is_harvested', false);

    if (error) {
      throw new Error(`Failed to count ongoing grows: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Create a new grow
   */
  static async createGrow(input: CreateGrowInput): Promise<Grow> {
    // Check if user already has 20 ongoing grows
    const ongoingCount = await this.countOngoingGrows(input.discord_user_id);
    if (ongoingCount >= 20) {
      throw new Error('You already have 20 ongoing grows. Please harvest or wait before starting a new one.');
    }

    const { data, error } = await supabase
      .from('grows')
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create grow: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a grow
   */
  static async updateGrow(id: string, input: UpdateGrowInput): Promise<Grow> {
    const { data, error } = await supabase
      .from('grows')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update grow: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark a grow as harvested
   */
  static async harvestGrow(id: string): Promise<Grow> {
    return this.updateGrow(id, {
      is_harvested: true,
      harvest_date: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Start flower stage for a grow
   */
  static async startFlowerStage(id: string): Promise<Grow> {
    return this.updateGrow(id, {
      flower_start_date: new Date().toISOString().split('T')[0],
      current_stage: 'flower',
    });
  }

  /**
   * Create a grow update (daily log)
   */
  static async createGrowUpdate(input: CreateGrowUpdateInput): Promise<GrowUpdate> {
    const { data, error } = await supabase
      .from('grow_updates')
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create grow update: ${error.message}`);
    }

    return data;
  }

  /**
   * Get grow updates for a specific grow
   */
  static async getGrowUpdates(growId: string): Promise<GrowUpdate[]> {
    const { data, error } = await supabase
      .from('grow_updates')
      .select('*')
      .eq('grow_id', growId)
      .order('update_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch grow updates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get today's update for a grow
   */
  static async getTodayUpdate(growId: string): Promise<GrowUpdate | null> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('grow_updates')
      .select('*')
      .eq('grow_id', growId)
      .eq('update_date', today)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch today's update: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all ongoing grows for daily prompts
   */
  static async getAllOngoingGrows(): Promise<Grow[]> {
    const { data, error } = await supabase
      .from('grows')
      .select('*')
      .eq('is_harvested', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all ongoing grows: ${error.message}`);
    }

    return data || [];
  }
}
