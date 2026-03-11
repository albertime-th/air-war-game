// 游戏配置
const config = {
    canvasWidth: 550,
    canvasHeight: 600,
    playerWidth: 60,
    playerHeight: 40,
    bulletWidth: 4,
    bulletHeight: 10,
    bulletSpeed: 8,
    enemySpawnInterval: 600,
    bulletInterval: 150,
    playerSpeed: 18
};

// 游戏状态
let gameState = {
    player: {
        x: config.canvasWidth / 2 - config.playerWidth / 2,
        y: config.canvasHeight - config.playerHeight - 20,
        width: config.playerWidth,
        height: config.playerHeight,
        speed: config.playerSpeed
    },
    bullets: [],
    enemies: [],
    explosions: [],
    score: 0,
    isRunning: false,
    isPaused: false,
    gameInterval: null,
    bulletInterval: null,
    enemyInterval: null
};

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// 触摸控制
let touchStartX = 0;
let touchEndX = 0;

// 初始化游戏
function init() {
    // 事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    
    // 键盘控制
    document.addEventListener('keydown', handleKeyPress);
    
    // 触摸控制
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    
    // 鼠标控制
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    // 初始渲染
    render();
}

// 处理键盘事件
function handleKeyPress(e) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            gameState.player.x = Math.max(0, gameState.player.x - gameState.player.speed);
            break;
        case 'ArrowRight':
            gameState.player.x = Math.min(config.canvasWidth - gameState.player.width, gameState.player.x + gameState.player.speed);
            break;
    }
}

// 处理触摸开始
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

// 处理触摸移动
function handleTouchMove(e) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    touchEndX = e.touches[0].clientX;
    const touchDiff = touchEndX - touchStartX;
    
    // 计算移动距离，根据屏幕宽度调整灵敏度
    const moveAmount = touchDiff * 0.5;
    
    gameState.player.x = Math.max(0, Math.min(config.canvasWidth - gameState.player.width, gameState.player.x + moveAmount));
    
    // 更新触摸起始位置
    touchStartX = touchEndX;
}

// 处理鼠标移动
function handleMouseMove(e) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // 获取鼠标在画布上的位置
    const rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    
    // 限制鼠标左右移动范围，确保鼠标不会移出游戏画面左右边界
    // 但允许上下移动
    mouseX = Math.max(0, Math.min(config.canvasWidth, mouseX));
    
    // 设置飞机位置，确保飞机不会超出画布
    gameState.player.x = Math.max(0, Math.min(config.canvasWidth - gameState.player.width, mouseX - gameState.player.width / 2));
}

// 处理鼠标离开画布
function handleMouseLeave(e) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // 获取画布边界
    const rect = canvas.getBoundingClientRect();
    
    // 只在鼠标左右移出时阻止，允许上下移出
    if (e.clientX < rect.left || e.clientX > rect.right) {
        // 鼠标移出左右边界，阻止默认行为
        e.preventDefault();
        e.stopPropagation();
        
        // 计算鼠标应该在的位置（保持在左右边界内）
        const boundedX = Math.max(rect.left, Math.min(rect.right, e.clientX));
        
        // 创建一个新的鼠标移动事件，将鼠标位置限制在画布内
        const event = new MouseEvent('mousemove', {
            clientX: boundedX,
            clientY: e.clientY,
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        // 触发新的鼠标移动事件
        canvas.dispatchEvent(event);
    }
}

// 开始游戏
function startGame() {
    if (!gameState.isRunning) {
        gameState.isRunning = true;
        gameState.isPaused = false;
        updateButtonStates();
        
        // 启动游戏循环
        gameState.gameInterval = setInterval(gameLoop, 16); // 约60fps
        
        // 启动子弹发射
        gameState.bulletInterval = setInterval(fireBullet, config.bulletInterval);
        
        // 启动敌机生成
        gameState.enemyInterval = setInterval(spawnEnemy, config.enemySpawnInterval);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isRunning) {
        gameState.isPaused = !gameState.isPaused;
        updateButtonStates();
    }
}

// 重置游戏
function resetGame() {
    // 清除所有定时器
    clearInterval(gameState.gameInterval);
    clearInterval(gameState.bulletInterval);
    clearInterval(gameState.enemyInterval);
    
    // 重置游戏状态
    gameState = {
        player: {
            x: config.canvasWidth / 2 - config.playerWidth / 2,
            y: config.canvasHeight - config.playerHeight - 20,
            width: config.playerWidth,
            height: config.playerHeight,
            speed: config.playerSpeed
        },
        bullets: [],
        enemies: [],
        explosions: [],
        score: 0,
        isRunning: false,
        isPaused: false,
        gameInterval: null,
        bulletInterval: null,
        enemyInterval: null
    };
    
    updateButtonStates();
    updateScore();
    render();
}

// 更新按钮状态
function updateButtonStates() {
    startBtn.disabled = gameState.isRunning;
    pauseBtn.disabled = !gameState.isRunning;
    resetBtn.disabled = !gameState.isRunning;
    pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';
}

// 发射子弹
function fireBullet() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const bullet = {
        x: gameState.player.x + gameState.player.width / 2 - config.bulletWidth / 2,
        y: gameState.player.y - config.bulletHeight,
        width: config.bulletWidth,
        height: config.bulletHeight,
        speed: config.bulletSpeed
    };
    
    gameState.bullets.push(bullet);
}

// 生成敌机
function spawnEnemy() {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // 随机选择敌机类型
    const enemyType = Math.floor(Math.random() * 9) + 1;
    
    let enemyWidth, enemyHeight, enemySpeed;
    
    switch (enemyType) {
        case 1:
            // 小型敌机
            enemyWidth = 30;
            enemyHeight = 25;
            enemySpeed = 3;
            break;
        case 2:
            // 中型敌机
            enemyWidth = 45;
            enemyHeight = 35;
            enemySpeed = 4;
            break;
        case 3:
            // 大型敌机
            enemyWidth = 60;
            enemyHeight = 45;
            enemySpeed = 5;
            break;
        case 4:
            // 快速敌机
            enemyWidth = 25;
            enemyHeight = 20;
            enemySpeed = 6;
            break;
        case 5:
            // 超快速敌机
            enemyWidth = 20;
            enemyHeight = 15;
            enemySpeed = 7;
            break;
        case 6:
            // 高速敌机
            enemyWidth = 35;
            enemyHeight = 30;
            enemySpeed = 8;
            break;
        case 7:
            // 极速敌机
            enemyWidth = 28;
            enemyHeight = 22;
            enemySpeed = 9;
            break;
        case 8:
            // 闪电敌机
            enemyWidth = 18;
            enemyHeight = 14;
            enemySpeed = 10;
            break;
        case 9:
            // 终极敌机
            enemyWidth = 40;
            enemyHeight = 30;
            enemySpeed = 11;
            break;
    }
    
    const enemy = {
        x: Math.random() * (config.canvasWidth - enemyWidth),
        y: -enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        speed: enemySpeed,
        type: enemyType
    };
    
    gameState.enemies.push(enemy);
}

// 游戏循环
function gameLoop() {
    if (gameState.isPaused) return;
    
    // 更新游戏状态
    update();
    
    // 渲染游戏
    render();
}

// 更新游戏状态
function update() {
    // 更新子弹位置
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
    });
    
    // 更新敌机位置
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.y += enemy.speed;
        return enemy.y < config.canvasHeight;
    });
    
    // 更新爆炸效果
    gameState.explosions = gameState.explosions.filter(explosion => {
        explosion.life--;
        
        // 更新粒子位置
        explosion.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.size *= 0.95;
        });
        
        return explosion.life > 0;
    });
    
    // 碰撞检测
    checkCollisions();
}

// 碰撞检测
function checkCollisions() {
    // 子弹与敌机碰撞
    gameState.bullets.forEach((bullet, bulletIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                // 创建爆炸效果
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                // 移除子弹和敌机
                gameState.bullets.splice(bulletIndex, 1);
                gameState.enemies.splice(enemyIndex, 1);
                
                // 增加分数
                gameState.score += 10;
                updateScore();
            }
        });
    });
    
    // 敌机与玩家碰撞
    gameState.enemies.forEach((enemy, enemyIndex) => {
        if (isColliding(gameState.player, enemy)) {
            // 创建爆炸效果
            createExplosion(gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2);
            gameOver();
        }
    });
}

// 检查碰撞
function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// 创建爆炸效果
function createExplosion(x, y) {
    const explosion = {
        x: x,
        y: y,
        particles: [],
        life: 60 // 爆炸持续时间
    };
    
    // 创建爆炸粒子
    for (let i = 0; i < 15; i++) {
        const particle = {
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: (Math.random() - 0.5) * 6,
            speedY: (Math.random() - 0.5) * 6,
            color: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 100)}, 0)`
        };
        explosion.particles.push(particle);
    }
    
    gameState.explosions.push(explosion);
}

// 游戏结束
function gameOver() {
    // 清除所有定时器
    if (gameState.gameInterval) clearInterval(gameState.gameInterval);
    if (gameState.bulletInterval) clearInterval(gameState.bulletInterval);
    if (gameState.enemyInterval) clearInterval(gameState.enemyInterval);
    
    gameState.isRunning = false;
    gameState.isPaused = false;
    
    // 显示游戏结束提示
    alert(`Game Over! Your score: ${gameState.score}\n游戏结束！你的分数是：${gameState.score}`);
    
    // 重置游戏状态，以便可以再次开始游戏
    resetGame();
}

// 更新分数
function updateScore() {
    scoreElement.textContent = gameState.score;
}

// 渲染游戏
function render() {
    // 清空画布
    ctx.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
    
    // 绘制玩家飞机
    drawPlayer();
    
    // 绘制子弹
    drawBullets();
    
    // 绘制敌机
    drawEnemies();
    
    // 绘制爆炸效果
    drawExplosions();
    
    // 绘制黑色圆圈鼠标指针（位于飞机正中间）
    const player = gameState.player;
    const pointerX = player.x + player.width / 2;
    const pointerY = player.y + player.height / 2;
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 5, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制玩家飞机
function drawPlayer() {
    const player = gameState.player;
    
    // 计算中间矩形高度（原高度的1.5倍）
    const middleHeight = player.height * 1.5;
    
    // 绘制中间白色矩形（稍微变窄）
    const middleWidth = player.width - 26; // 比原来窄6px
    const middleX = player.x + 13; // 居中对齐
    const middleY = player.y - (middleHeight - player.height) / 2; // 居中对齐
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(middleX, middleY, middleWidth, middleHeight);
    
    // 绘制左右灰色小矩形（稍微加长，高度为中间矩形的三分之一，与中间矩形底线平行）
    const wingWidth = 13; // 比原来长3px
    const wingHeight = middleHeight / 3;
    const wingY = middleY + middleHeight - wingHeight; // 与中间矩形底线平行
    
    // 左翼
    ctx.fillStyle = '#888888';
    ctx.fillRect(player.x, wingY, wingWidth, wingHeight);
    
    // 右翼
    ctx.fillRect(player.x + player.width - wingWidth, wingY, wingWidth, wingHeight);
    
    // 绘制顶部半个圆形（白色，稍微变窄）
    const circleRadius = middleWidth / 2;
    const circleX = middleX + middleWidth / 2;
    const circleY = middleY;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, Math.PI, 0);
    ctx.lineTo(circleX + circleRadius, circleY);
    ctx.lineTo(circleX - circleRadius, circleY);
    ctx.closePath();
    ctx.fill();
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = '#FFEB3B';
    gameState.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 绘制敌机
function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        switch (enemy.type) {
            case 1:
                // 小型敌机 - 三角形
                ctx.fillStyle = '#F44336';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                ctx.lineTo(enemy.x, enemy.y + enemy.height);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#C62828';
                ctx.fillRect(enemy.x - 3, enemy.y + enemy.height / 2, 3, 2);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 3, 2);
                break;
            case 2:
                // 中型敌机 - 矩形
                ctx.fillStyle = '#FF9800';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // 绘制敌机机翼
                ctx.fillStyle = '#E65100';
                ctx.fillRect(enemy.x - 5, enemy.y + enemy.height / 2, 5, 3);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 5, 3);
                
                // 绘制敌机窗户
                ctx.fillStyle = '#FFE0B2';
                ctx.fillRect(enemy.x + 5, enemy.y + 5, 10, 8);
                ctx.fillRect(enemy.x + enemy.width - 15, enemy.y + 5, 10, 8);
                break;
            case 3:
                // 大型敌机 - 圆角矩形
                ctx.fillStyle = '#9C27B0';
                ctx.beginPath();
                ctx.roundRect(enemy.x, enemy.y, enemy.width, enemy.height, 5);
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#6A0080';
                ctx.fillRect(enemy.x - 8, enemy.y + enemy.height / 2, 8, 4);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 8, 4);
                
                // 绘制敌机窗户
                ctx.fillStyle = '#E1BEE7';
                ctx.fillRect(enemy.x + 10, enemy.y + 10, 12, 10);
                ctx.fillRect(enemy.x + enemy.width - 22, enemy.y + 10, 12, 10);
                
                // 绘制敌机引擎
                ctx.fillStyle = '#4A148C';
                ctx.fillRect(enemy.x + 15, enemy.y + enemy.height - 8, 10, 8);
                ctx.fillRect(enemy.x + enemy.width - 25, enemy.y + enemy.height - 8, 10, 8);
                break;
            case 4:
                // 快速敌机 - 菱形
                ctx.fillStyle = '#2196F3';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height / 2);
                ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
                ctx.lineTo(enemy.x, enemy.y + enemy.height / 2);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#1565C0';
                ctx.fillRect(enemy.x - 3, enemy.y + enemy.height / 2, 3, 2);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 3, 2);
                break;
            case 5:
                // 超快速敌机 - 三角形（小）
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                ctx.lineTo(enemy.x, enemy.y + enemy.height);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#2E7D32';
                ctx.fillRect(enemy.x - 2, enemy.y + enemy.height / 2, 2, 2);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 2, 2);
                break;
            case 6:
                // 高速敌机 - 椭圆形
                ctx.fillStyle = '#FFC107';
                ctx.beginPath();
                ctx.ellipse(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#F57C00';
                ctx.fillRect(enemy.x - 4, enemy.y + enemy.height / 2, 4, 3);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 4, 3);
                break;
            case 7:
                // 极速敌机 - 梯形
                ctx.fillStyle = '#673AB7';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width * 0.3, enemy.y);
                ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                ctx.lineTo(enemy.x, enemy.y + enemy.height);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#4527A0';
                ctx.fillRect(enemy.x - 3, enemy.y + enemy.height / 2, 3, 2);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 3, 2);
                break;
            case 8:
                // 闪电敌机 - 细长三角形
                ctx.fillStyle = '#00BCD4';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                ctx.lineTo(enemy.x, enemy.y + enemy.height);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#0097A7';
                ctx.fillRect(enemy.x - 2, enemy.y + enemy.height / 2, 2, 2);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 2, 2);
                break;
            case 9:
                // 终极敌机 - 六边形
                ctx.fillStyle = '#FF5722';
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.3);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.7);
                ctx.lineTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
                ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.7);
                ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.3);
                ctx.closePath();
                ctx.fill();
                
                // 绘制敌机机翼
                ctx.fillStyle = '#D84315';
                ctx.fillRect(enemy.x - 5, enemy.y + enemy.height / 2, 5, 3);
                ctx.fillRect(enemy.x + enemy.width, enemy.y + enemy.height / 2, 5, 3);
                
                // 绘制敌机窗户
                ctx.fillStyle = '#FFCCBC';
                ctx.fillRect(enemy.x + 5, enemy.y + 5, 8, 6);
                ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 5, 8, 6);
                break;
        }
    });
}

// 绘制爆炸效果
function drawExplosions() {
    gameState.explosions.forEach(explosion => {
        explosion.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
        });
    });
}

// 启动游戏
init();