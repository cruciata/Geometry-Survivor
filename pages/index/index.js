// pages/index/index.js
Page({
  data: {
    gameState: 'START',
    score: 0,
    timerStr: '00:00',
  },
  
  canvas: null,
  ctx: null,
  dpr: 1,
  width: 0,
  height: 0,
  
  // 游戏状态
  player: { x: 0, y: 0, radius: 20, speed: 5 },
  enemies: [],
  projectiles: [],
  lastTime: 0,
  
  onLoad() {
    const { windowWidth, windowHeight, pixelRatio } = wx.getSystemInfoSync();
    this.dpr = pixelRatio;
    this.width = windowWidth;
    this.height = windowHeight;
    this.player.x = windowWidth / 2;
    this.player.y = windowHeight / 2;
    
    this.initCanvas();
  },
  
  initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        
        canvas.width = res[0].width * this.dpr;
        canvas.height = res[0].height * this.dpr;
        ctx.scale(this.dpr, this.dpr);
        
        this.canvas = canvas;
        this.ctx = ctx;
        
        this.render();
      });
  },
  
  startGame() {
    this.setData({ gameState: 'PLAYING', score: 0 });
    this.lastTime = Date.now();
    this.gameLoop();
  },
  
  gameLoop() {
    if (this.data.gameState !== 'PLAYING') return;
    
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    this.update(dt);
    this.render();
    
    this.canvas.requestAnimationFrame(this.gameLoop.bind(this));
  },
  
  update(dt) {
    // 自动生成敌人
    if (Math.random() < 0.02) {
      this.spawnEnemy();
    }
    
    // 更新敌人位置
    const enemies = this.enemies;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0) {
        enemy.x += (dx/dist) * enemy.speed;
        enemy.y += (dy/dist) * enemy.speed;
      }
    }
  },
  
  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * this.width; y = -20; }
    else if (side === 1) { x = this.width + 20; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + 20; }
    else { x = -20; y = Math.random() * this.height; }
    
    this.enemies.push({ x, y, radius: 15, speed: 1.5, color: '#ff4444' });
  },
  
  render() {
    const ctx = this.ctx;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制常驻标题 (游玩界面显示)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // 半透明白色，避免干扰游戏
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('几何战士', this.width / 2, 100); // Moved from 40 to 100
    ctx.restore();
    
    // 绘制玩家
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#007aff';
    ctx.fill();
    ctx.closePath();
    
    // 绘制敌人
    const enemies = this.enemies;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.closePath();
    }
  },
  
  touchMove(e) {
    if (this.data.gameState !== 'PLAYING') return;
    const touch = e.touches[0];
    this.player.x = touch.x;
    this.player.y = touch.y;
  }
});
