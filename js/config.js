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
    UNKNOWN: 'unknown'
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
  }
};
