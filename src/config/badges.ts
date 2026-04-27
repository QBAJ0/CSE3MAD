import { ActivityResult } from '../types';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
};

export const BADGES: Badge[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first challenge',
    icon: 'rocket-outline',
    rarity: 'common',
  },
  {
    id: 'triple_threat',
    name: 'Triple Threat',
    description: 'Complete 3 different challenges',
    icon: 'flask-outline',
    rarity: 'common',
  },
  {
    id: 'stemm_master',
    name: 'STEMM Master',
    description: 'Complete all 7 STEMM challenges',
    icon: 'trophy',
    rarity: 'legendary',
  },
  {
    id: 'five_star',
    name: 'Star Scientist',
    description: 'Give a 5-star rating to an activity',
    icon: 'star',
    rarity: 'common',
  },
  {
    id: 'gps_explorer',
    name: 'Explorer',
    description: 'GPS tag your experiment location',
    icon: 'navigate-outline',
    rarity: 'common',
  },
  {
    id: 'speed_runner',
    name: 'Speed Runner',
    description: 'Complete a timed challenge without penalty',
    icon: 'flash',
    rarity: 'rare',
  },
  {
    id: 'triple_design',
    name: 'Triple Designer',
    description: 'Test 3 prototype designs in one challenge',
    icon: 'refresh-circle-outline',
    rarity: 'rare',
  },
  {
    id: 'deep_thinker',
    name: 'Deep Thinker',
    description: 'Write a 100+ character reflection',
    icon: 'pencil-outline',
    rarity: 'rare',
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: 'Maintain a 7-day activity streak',
    icon: 'flame',
    rarity: 'epic',
  },
  {
    id: 'xp_legend',
    name: 'XP Legend',
    description: 'Earn 1,000 or more total XP',
    icon: 'ribbon-outline',
    rarity: 'epic',
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Earn 200+ XP in a single challenge',
    icon: 'checkmark-circle',
    rarity: 'rare',
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Register a team with 4 or more members',
    icon: 'people',
    rarity: 'common',
  },
];

export const RARITY_COLOR: Record<BadgeRarity, string> = {
  common: '#64748B',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};

export const RARITY_BG: Record<BadgeRarity, string> = {
  common: '#F1F5F9',
  rare: '#EFF6FF',
  epic: '#F5F3FF',
  legendary: '#FFFBEB',
};

export const RARITY_BORDER: Record<BadgeRarity, string> = {
  common: '#E2E8F0',
  rare: '#BFDBFE',
  epic: '#DDD6FE',
  legendary: '#FDE68A',
};

/**
 * Returns badge IDs that are newly earned by this activity result and have not
 * been earned before (i.e., are absent from earnedIds).
 */
export function checkNewBadges({
  result,
  allCompleted,
  streak,
  newTotalXP,
  earnedIds,
  teamMemberCount,
}: {
  result: ActivityResult;
  allCompleted: ActivityResult[];
  streak: number;
  newTotalXP: number;
  earnedIds: Set<string>;
  teamMemberCount: number;
}): string[] {
  const newlyEarned: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (!earnedIds.has(id) && condition) newlyEarned.push(id);
  };

  const uniqueCompleted = new Set(allCompleted.map((a) => a.challengeId)).size;

  check('first_steps', uniqueCompleted >= 1);
  check('triple_threat', uniqueCompleted >= 3);
  check('stemm_master', uniqueCompleted >= 7);
  check('five_star', result.rating === 5);
  check('gps_explorer', !!result.location);
  check('speed_runner', result.completedInTime === true);
  check('triple_design', result.prototypes.length >= 3);
  check('deep_thinker', result.reflection.length >= 100);
  check('on_fire', streak >= 7);
  check('xp_legend', newTotalXP >= 1000);
  check('high_scorer', (result.points ?? 0) >= 200);
  check('team_player', teamMemberCount >= 4);

  return newlyEarned;
}
