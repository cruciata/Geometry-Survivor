export interface Vector2D {
  x: number;
  y: number;
}

export enum WeaponType {
  KNIFE = 'KNIFE',
  FIREBALL = 'FIREBALL',
  LIGHTNING = 'LIGHTNING',
  SWORD = 'SWORD',
  HOMING = 'HOMING',
  SPIKE = 'SPIKE',
  BOMB = 'BOMB',
}

export enum PassiveType {
  SPEED = 'SPEED',
  RANGE = 'RANGE',
  HEAL = 'HEAL',
  MAGNET = 'MAGNET',
  SPRINT = 'SPRINT',
  RAGE = 'RAGE',
  EXP_MAGNET = 'EXP_MAGNET',
  DOUBLE_UPGRADE = 'DOUBLE_UPGRADE',
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: WeaponType | PassiveType;
  level: number;
  maxLevel: number;
  nextLevelPreview?: string;
}

export interface GroundSpike {
  id: string;
  pos: Vector2D;
  radius: number;
  state: 'WARNING' | 'ACTIVE';
  timer: number;
  damage: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  color: string;
  stats: {
    speed: number; // multiplier or offset? Let's use multiplier for simplicity: 1.0 is base
    hp: number;
    attackInterval: number;
  };
  initialWeapon: WeaponType;
  specialDescription: string;
  unlockCondition: string;
}

export interface Player extends Entity {
  characterId: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
  skills: Skill[];
  attackRange: number;
  magnetRange: number;
  regenRate: number;
  shieldActive?: boolean;
  speedBoostTimer?: number;
  timeStasisTimer?: number;
  noDamageTimer?: number; // For Time Traveler unlock
  fireballKills?: number; // For Mage unlock
  lastSkillTime?: number;
  skillCooldown?: number;
}

export interface Enemy extends Entity {
  damage: number;
  xpValue: number;
  type: 'TRIANGLE' | 'SQUARE' | 'DIAMOND' | 'STAR' | 'CIRCLE' | 'BOSS';
  color: string;
  isElite?: boolean;
  sprintTimer?: number;
  shootTimer?: number;
  phase?: 'normal' | 'rage';
}

export interface GameItem {
  id: string;
  pos: Vector2D;
  type: 'CLEAR';
  radius: number;
  rotation: number;
}

export interface Projectile {
  id: string;
  pos: Vector2D;
  vel: Vector2D;
  damage: number;
  radius: number;
  type: WeaponType;
  pierce: number;
  lifeTime: number;
  color: string;
  explosionRadius?: number;
}

export interface XPGem {
  id: string;
  pos: Vector2D;
  value: number;
  color: string;
}
