window.Difficulty = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
};

window.ControlMode = {
    MOUSE: 'mouse',
    KEYBOARD: 'keyboard',
    TOUCH: 'touch'
};

window.DeathCause = {
    EATEN: 'eaten',
    EXPLOSION: 'explosion',
    CLAM_TRAP: 'clam_trap',
    UNKNOWN: 'unknown'
};

window.SkinId = {
    DEFAULT: 'default',
    MOONLIGHT_FLOW: 'moonlight_flow',
    STAR_DOMINATOR: 'star_dominator',
    RED_BLADE: 'red_blade',
    GOLD_GUARDIAN: 'gold_guardian'
};

window.FishType = {
    NORMAL: 'normal',
    WHALE_SHARK: 'whale_shark',
    SWORD_FISH: 'sword_fish',
    PUFFER_FISH: 'puffer_fish'
};

window.SkillType = {
    PASSIVE: 'passive',
    ACTIVE: 'active'
};

window.DifficultyConfig = {
    easy: {
        name: '简单',
        description: '敌人较少，速度较慢，成长较快',
        maxEnemyFish: 6,
        enemySpeedMultiplier: 0.8,
        growthMultiplier: 1.3,
        dangerRatio: 1.25,
        eatableRatio: 0.8,
        powerupSpawnRate: 0.008,
        startupDuration: 8000,
        shieldDuration: 20000,
        spawnCooldown: 500
    },
    normal: {
        name: '普通',
        description: '标准难度体验',
        maxEnemyFish: 8,
        enemySpeedMultiplier: 1.0,
        growthMultiplier: 1.0,
        dangerRatio: 1.15,
        eatableRatio: 0.85,
        powerupSpawnRate: 0.005,
        startupDuration: 5000,
        shieldDuration: 15000,
        spawnCooldown: 400
    },
    hard: {
        name: '困难',
        description: '敌人较多，速度较快，成长较慢',
        maxEnemyFish: 10,
        enemySpeedMultiplier: 1.2,
        growthMultiplier: 0.7,
        dangerRatio: 1.1,
        eatableRatio: 0.9,
        powerupSpawnRate: 0.003,
        startupDuration: 3000,
        shieldDuration: 12000,
        spawnCooldown: 300
    }
};

window.CONFIG = {
  canvasWidth: 1000,
  canvasHeight: 700,
  playerBaseSize: 25,
  playerBaseSpeed: 3,
  playerMaxSize: 120,
  maxPowerups: 3,
  speedBoostMultiplier: 1.8,
  speedBoostDuration: 8000,
  shieldDuration: 15000,
  startupDuration: 5000,
  eatableSizeRatio: 0.85,
  dangerSizeRatio: 1.15,
  minSpeed: 1.5,
  maxSpeed: 6,

  speedLevels: [
    { name: "极慢", threshold: 0.6, color: "#9e9e9e" },
    { name: "缓慢", threshold: 0.75, color: "#607d8b" },
    { name: "正常", threshold: 1.0, color: "#4caf50" },
    { name: "快速", threshold: 1.3, color: "#ffc107" },
    { name: "极速", threshold: 2.0, color: "#ff5722" },
  ],

  growthStages: [
    {
      name: "幼鱼",
      minSize: 25,
      maxSize: 35,
      scorePerFish: 10,
      sizeColor: "#64b5f6",
    },
    {
      name: "小鱼",
      minSize: 35,
      maxSize: 50,
      scorePerFish: 15,
      sizeColor: "#42a5f5",
    },
    {
      name: "中鱼",
      minSize: 50,
      maxSize: 70,
      scorePerFish: 20,
      sizeColor: "#2196f3",
    },
    {
      name: "大鱼",
      minSize: 70,
      maxSize: 90,
      scorePerFish: 30,
      sizeColor: "#1976d2",
    },
    {
      name: "巨型鱼",
      minSize: 90,
      maxSize: 120,
      scorePerFish: 50,
      sizeColor: "#0d47a1",
    },
  ],

  stageRequirements: [0, 100, 300, 600, 1000],

  explosion: {
    enabled: true,
    minInterval: 15000,
    maxInterval: 30000,
    countdownTime: 5000,
    minRadius: 100,
    maxRadius: 200,
    warningPulseRate: 0.5
  },

  pearlClam: {
    enabled: true,
    minInterval: 20000,
    maxInterval: 40000,
    openDuration: 5000,
    warningDuration: 1500,
    maxClams: 2,
    clamSize: 60,
    pearlSize: 15,
    pearlValue: 1,
    trapRadius: 40,
    spawnChance: 0.002
  },

  skins: {
    moonlight_flow: {
      id: window.SkinId.MOONLIGHT_FLOW,
      name: '月潮流光',
      fishType: window.FishType.NORMAL,
      price: 10,
      description: '普通鱼专属皮肤 - 月光下流动的璀璨光芒',
      colors: {
        bodyColor: '#e0f2f1',
        darkColor: '#00897b',
        lightColor: '#b2dfdb',
        glowColor: '#4db6ac'
      }
    },
    star_dominator: {
      id: window.SkinId.STAR_DOMINATOR,
      name: '星穹霸主',
      fishType: window.FishType.WHALE_SHARK,
      price: 20,
      description: '鲸鲨专属皮肤 - 深邃星空中的霸主',
      colors: {
        bodyColor: '#1a237e',
        darkColor: '#0d1442',
        lightColor: '#3f51b5',
        glowColor: '#7c4dff'
      }
    },
    red_blade: {
      id: window.SkinId.RED_BLADE,
      name: '赤锋破浪',
      fishType: window.FishType.SWORD_FISH,
      price: 15,
      description: '剑鱼专属皮肤 - 赤红锋刃，破浪前行',
      colors: {
        bodyColor: '#d32f2f',
        darkColor: '#b71c1c',
        lightColor: '#ef5350',
        glowColor: '#ff5252'
      }
    },
    gold_guardian: {
      id: window.SkinId.GOLD_GUARDIAN,
      name: '金珠守卫',
      fishType: window.FishType.PUFFER_FISH,
      price: 15,
      description: '河豚专属皮肤 - 金色宝珠，坚不可摧',
      colors: {
        bodyColor: '#ffd54f',
        darkColor: '#f9a825',
        lightColor: '#ffecb3',
        glowColor: '#ffab00'
      }
    }
  },

  fishTypes: {
    normal: {
      name: '普通鱼',
      type: window.FishType.NORMAL,
      skillType: window.SkillType.PASSIVE,
      description: '均衡型鱼类，各项属性均衡',
      feature: '基础移动速度适中，适合新手体验',
      baseSize: 25,
      baseSpeed: 3,
      sizeColor: '#64b5f6',
      darkColor: '#1976d2',
      lightColor: '#bbdefb'
    },
    whale_shark: {
      name: '鲸鲨',
      type: window.FishType.WHALE_SHARK,
      skillType: window.SkillType.PASSIVE,
      description: '被动技能鱼：开局体型更大，但移动稍慢',
      feature: '初始体型+50%，移动速度-20%',
      baseSize: 38,
      baseSpeed: 2.4,
      sizeMultiplier: 1.5,
      speedMultiplier: 0.8,
      sizeColor: '#7986cb',
      darkColor: '#3949ab',
      lightColor: '#c5cae9'
    },
    sword_fish: {
      name: '剑鱼',
      type: window.FishType.SWORD_FISH,
      skillType: window.SkillType.ACTIVE,
      skillKey: 'j',
      skillName: '突进',
      description: '主动技能鱼：按J键向当前方向突进',
      feature: '突进时吃掉路径上所有可吞噬的鱼，冷却15秒',
      baseSize: 25,
      baseSpeed: 3.2,
      dashSpeed: 18,
      dashDuration: 600,
      dashDistance: 350,
      skillCooldown: 15000,
      sizeColor: '#ff7043',
      darkColor: '#d84315',
      lightColor: '#ffccbc'
    },
    puffer_fish: {
      name: '河豚',
      type: window.FishType.PUFFER_FISH,
      skillType: window.SkillType.ACTIVE,
      skillKey: 'k',
      skillName: '膨胀',
      description: '主动技能鱼：按K键主动膨胀',
      feature: '膨胀期间体型+80%，速度-50%，可吃掉比膨胀后小的鱼，冷却15秒',
      baseSize: 25,
      baseSpeed: 2.8,
      inflateMultiplier: 1.8,
      inflateSpeedMultiplier: 0.5,
      inflateDuration: 4000,
      skillCooldown: 15000,
      sizeColor: '#ab47bc',
      darkColor: '#7b1fa2',
      lightColor: '#e1bee7'
    }
  }
};
