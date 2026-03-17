import { Skill, WeaponType, PassiveType, Character, Level } from './types';

export const CHARACTERS: Character[] = [
  {
    id: 'warrior',
    name: '战士',
    description: '各方面属性均衡，适合新手。',
    color: '#1565c0',
    stats: { speed: 1.0, hp: 100, attackInterval: 1.0 },
    initialWeapon: WeaponType.KNIFE,
    specialDescription: '无特殊能力',
    unlockCondition: '初始可用'
  },
  {
    id: 'shadow',
    name: '夜影',
    description: '身手敏捷的暗影刺客。',
    color: '#4a148c',
    stats: { speed: 1.1, hp: 90, attackInterval: 0.96 },
    initialWeapon: WeaponType.KNIFE,
    specialDescription: '击杀敌人后0.5秒内移速+30%',
    unlockCondition: '首次通关3分钟模式'
  },
  {
    id: 'mechanic',
    name: '铁心',
    description: '擅长防御与自动武器。',
    color: '#e65100',
    stats: { speed: 0.9, hp: 120, attackInterval: 1.1 },
    initialWeapon: WeaponType.HOMING,
    specialDescription: '每30秒自动生成一个护盾（抵挡1次伤害）',
    unlockCondition: '累计击杀1000个敌人'
  },
  {
    id: 'mage',
    name: '焰灵',
    description: '掌控火焰之力的元素使。',
    color: '#bf360c',
    stats: { speed: 0.95, hp: 85, attackInterval: 1.2 },
    initialWeapon: WeaponType.FIREBALL,
    specialDescription: '技能升级时20%概率触发"双倍效果"（直接升2级）',
    unlockCondition: '单局使用火球击杀50个敌人'
  },
  {
    id: 'time',
    name: '瞬',
    description: '能够短时间干涉时间流向。',
    color: '#006064',
    stats: { speed: 1.05, hp: 95, attackInterval: 1.0 },
    initialWeapon: WeaponType.KNIFE,
    specialDescription: '每60秒可主动触发"时间缓滞"（3秒内敌人移速-50%）',
    unlockCondition: '在Boss战中无伤坚持30秒'
  },
  {
    id: 'berserker',
    name: '怒爪',
    description: '越战越勇的狂暴战士。',
    color: '#b71c1c',
    stats: { speed: 1.2, hp: 80, attackInterval: 0.8 },
    initialWeapon: WeaponType.SWORD,
    specialDescription: '血量每降低10%，攻速+5%（最多+50%）',
    unlockCondition: '单局击杀数达到300'
  }
];

export const SKILLS: Skill[] = [
  {
    id: 'knife',
    name: '飞刀',
    description: '向最近的敌人投掷一把具有穿透力的飞刀。',
    type: WeaponType.KNIFE,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加飞刀数量和穿透力',
  },
  {
    id: 'fireball',
    name: '火球',
    description: '命中时爆炸，造成范围伤害。',
    type: WeaponType.FIREBALL,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加爆炸半径和伤害',
  },
  {
    id: 'lightning',
    name: '闪电链',
    description: '打击一名敌人并弹射至其他目标。',
    type: WeaponType.LIGHTNING,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加弹射次数和伤害',
  },
  {
    id: 'sword',
    name: '旋转剑',
    description: '角色周围有旋转的剑，触碰敌人造成伤害。',
    type: WeaponType.SWORD,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加剑的数量或长度',
  },
  {
    id: 'homing',
    name: '追踪弹',
    description: '子弹自动追踪最近的敌人。',
    type: WeaponType.HOMING,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加弹数或穿透力',
  },
  {
    id: 'spike',
    name: '地刺',
    description: '在随机位置生成地刺，造成范围伤害。',
    type: WeaponType.SPIKE,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加范围或触发频率',
  },
  {
    id: 'bomb',
    name: '炸弹投手',
    description: '抛物线投掷炸弹，落地后爆炸。',
    type: WeaponType.BOMB,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '增加爆炸半径或分裂子弹',
  },
  {
    id: 'speed',
    name: '敏捷',
    description: '移动速度提升 20%。',
    type: PassiveType.SPEED,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '进一步提升移动速度',
  },
  {
    id: 'range',
    name: '远见',
    description: '攻击范围提升 30%。',
    type: PassiveType.RANGE,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '进一步提升攻击范围',
  },
  {
    id: 'heal',
    name: '再生',
    description: '随时间缓慢恢复生命值。',
    type: PassiveType.HEAL,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '提升生命恢复速度',
  },
  {
    id: 'magnet',
    name: '真空',
    description: '增加经验值收集范围。',
    type: PassiveType.MAGNET,
    level: 0,
    maxLevel: 5,
    nextLevelPreview: '进一步提升收集范围',
  },
  {
    id: 'sprint',
    name: '开局冲刺',
    description: '游戏开始前30秒移动速度大幅提升。',
    type: PassiveType.SPRINT,
    level: 0,
    maxLevel: 1,
    nextLevelPreview: '已达最大等级',
  },
  {
    id: 'rage',
    name: '濒死狂暴',
    description: '生命值低于20%时，攻击速度翻倍。',
    type: PassiveType.RAGE,
    level: 0,
    maxLevel: 1,
    nextLevelPreview: '已达最大等级',
  },
  {
    id: 'exp_magnet',
    name: '经验磁铁',
    description: '经验球会自动飞向玩家。',
    type: PassiveType.EXP_MAGNET,
    level: 0,
    maxLevel: 1,
    nextLevelPreview: '已达最大等级',
  },
  {
    id: 'double_upgrade',
    name: '双倍升级',
    description: '每次升级可选4个技能。',
    type: PassiveType.DOUBLE_UPGRADE,
    level: 0,
    maxLevel: 1,
    nextLevelPreview: '已达最大等级',
  },
];

export const LEVELS: Level[] = [
  {
    id: 'city',
    name: '城市废墟',
    description: '破碎的都市，几何生命的起源之地。',
    duration: 180,
    theme: { bgColor: '#263238', groundColor: 'rgba(255,255,255,0.05)', decorColor: '#37474f' },
    unlockCondition: '初始可用'
  },
  {
    id: 'neon',
    name: '霓虹实验室',
    description: '高压实验环境，注意随机出现的激光陷阱。',
    duration: 300,
    theme: { bgColor: '#1a237e', groundColor: '#00bcd4', decorColor: '#283593' },
    specialRules: ['随机激光陷阱', '实验体分裂'],
    unlockCondition: '通关城市废墟'
  },
  {
    id: 'volcano',
    name: '火山核心',
    description: '极热之地，岩浆不断上涨，寻找安全平台。',
    duration: 240,
    theme: { bgColor: '#3e2723', groundColor: '#ff5722', decorColor: '#4e342e' },
    specialRules: ['岩浆伤害', '安全平台', '自爆火灵'],
    unlockCondition: '使用焰灵通关任意关卡'
  },
  {
    id: 'void',
    name: '虚空裂隙',
    description: '无尽的虚空，重力异常，挑战生存极限。',
    duration: 0,
    theme: { bgColor: '#000000', groundColor: '#4a148c', decorColor: '#121212' },
    specialRules: ['重力吸引', '无限模式', '技能掉落'],
    unlockCondition: '累计生存30分钟'
  },
  {
    id: 'boss_rush',
    name: 'Boss Rush',
    description: '巅峰对决，连续挑战所有强大的首领。',
    duration: 600,
    theme: { bgColor: '#212121', groundColor: '#ffd700', decorColor: '#424242' },
    specialRules: ['仅限Boss', '中场休息', '无复活'],
    unlockCondition: '通关实验室与火山'
  }
];

export const ACHIEVEMENTS = [
  {
    id: 'first_blood',
    name: '第一滴血',
    description: '累计击杀 100 个敌人',
    icon: '🩸',
    target: 100
  },
  {
    id: 'survivor',
    name: '生存专家',
    description: '单局生存超过 2 分钟',
    icon: '🛡️',
    target: 120
  },
  {
    id: 'level_master',
    name: '等级大师',
    description: '单局达到 10 级',
    icon: '⭐',
    target: 10
  },
  {
    id: 'boss_slayer',
    name: '首领克星',
    description: '击败最终首领',
    icon: '⚔️',
    target: 1
  },
  {
    id: 'collector',
    name: '收集狂人',
    description: '累计收集 1000 个经验球',
    icon: '💎',
    target: 1000
  }
];

export const getSkillUpgrade = (skill: Skill) => {
  // Simple scaling for demo
  return {
    ...skill,
    level: skill.level + 1,
  };
};
