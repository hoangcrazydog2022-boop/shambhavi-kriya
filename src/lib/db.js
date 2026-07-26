import { supabase } from './supabase';

// --- User Profiles/Settings ---

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist yet, create with defaults
    return createProfile(userId);
  }
  if (error) throw error;
  return data;
}

export async function createProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      aum_variant: 5,
      cat_stretch_duration: 270,
      bandha_duration: 150,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// --- Sessions ---

export async function saveSession(sessionData) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getSessionStats(userId) {
  const sessions = await getSessions(userId);
  const now = new Date();
  
  // Start of current week (Monday)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const totalSessions = sessions.length;
  const thisWeek = sessions.filter(s => new Date(s.started_at) >= startOfWeek).length;
  const thisMonth = sessions.filter(s => new Date(s.started_at) >= startOfMonth).length;
  
  return { totalSessions, thisWeek, thisMonth, sessions };
}
