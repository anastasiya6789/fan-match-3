import { SUPABASE_CONFIG } from './config.js';

const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const { createClient } = supabase;
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const auth = supabaseClient.auth;

// Получить или создать профиль пользователя
export async function getOrCreateProfile(user) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    
    return null;
  }

  if (!data) {
    const { data: newProfile, error: insertError } = await supabaseClient
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        username: user.email.split('@')[0] || 'Player',
        coins: 10000,
        boosters: { bomb: 3, shuffle: 2, extramoves: 5, '52': 1 }
      })
      .select()
      .single();

    if (insertError) {
      
      return null;
    }
    return newProfile;
  }

  return data;
}

// Сохранить/обновить рекорд
export async function saveScore(userId, newScore, level) {
  const { error } = await supabaseClient
    .from('scores')
    .upsert({
      user_id: userId,
      score: newScore,
      level: level,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    
  }
}

// Получить топ-10 игроков
export async function getTopPlayers(limit = 10) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('user_id, username, lifetime_score, level')
    .order('lifetime_score', { ascending: false })
    .limit(limit);

  if (error) {
    
    return [];
  }

  return data || [];
}

// Подписка на изменения в scores (realtime)
export function subscribeToScores(callback) {
  return supabaseClient
    .channel('scores-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, payload => {
      callback(payload);
    })
    .subscribe();
}

// Загрузить прогресс (с бустерами)
export async function loadProgress(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('level, lifetime_score, coins, boosters')
    .eq('user_id', userId)
    .single();

  if (error) {
    
    return { 
      level: 1, 
      lifetime_score: 0, 
      coins: 10000,
      boosters: { bomb: 3, shuffle: 2, extramoves: 5, '52': 1 }
    };
  }

  return {
    level: data.level || 1,
    lifetime_score: data.lifetime_score || 0,
    coins: data.coins || 10000,
    boosters: data.boosters || { bomb: 3, shuffle: 2, extramoves: 5, '52': 1 }
  };
}

// Сохранить прогресс (с бустерами)
export async function saveProgress(userId, level, lifetime_score, coins, boosters) {
  if (!userId) {
    
    return;
  }

  

  const { data, error } = await supabaseClient
    .from('profiles')
    .update({
      level: level,
      lifetime_score: lifetime_score,
      coins: coins,
      boosters: boosters,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select();

  if (error) {
    
    return error;
  } else {
    
    return null;
  }
}

// Получить текущего пользователя
export async function getCurrentUser() {
  const { data: { session } } = await auth.getSession();
  return session?.user || null;
}