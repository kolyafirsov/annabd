const state = {
    screen: 'start',
    totalBalance: 0,
    currentLevelBalance: 0,
    score: 0,
    gameActive: false,
    playerY: 0,
    playerVY: 0,
    gravity: 0.52,
    jumpStrength: -10.5,
    obstacles: [],
    coins: [],
    fallingItems: [],
    frame: 0,
    speed: 4,
    maxGift: 3000,
    taxDistance: -150,
    animationId: null,
    level: 1,
    timer: 15
};

const elements = {
    screens: {
        start: document.getElementById('screen-start'),
        game1: document.getElementById('screen-game-1'),
        game2: document.getElementById('screen-game-2'),
        game3: document.getElementById('screen-game-3'),
        over: document.getElementById('screen-over'),
        success: document.getElementById('screen-success'),
        win: document.getElementById('screen-win')
    },
    player: document.getElementById('player'),
    tax: document.getElementById('tax-inspector'),
    balance: document.getElementById('balance'),
    score: document.getElementById('score'),
    gameContainer: document.getElementById('game-container'),
    catcherContainer: document.getElementById('catcher-container'),
    safe: document.getElementById('safe'),
    overMsg: document.getElementById('over-msg'),
    finalBalance: document.getElementById('final-balance')
};

// Set player image
elements.player.style.backgroundImage = "url('img/player.png')";

// Helper: get container width at runtime
function getContainerWidth() {
    return elements.gameContainer.offsetWidth || 800;
}

function getCatcherWidth() {
    return elements.catcherContainer.offsetWidth || 800;
}

function getSafeWidth() {
    return elements.safe.offsetWidth || 80;
}

function showScreen(screenId) {
    Object.values(elements.screens).forEach(s => s.classList.remove('active'));
    elements.screens[screenId].classList.add('active');
    state.screen = screenId;
}

// LEVEL 1: RUNNER
function startLevel1() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.currentLevelBalance = 0;
    state.score = 0;
    state.obstacles = [];
    state.coins = [];
    state.frame = 0;
    state.playerY = 0;
    state.taxDistance = -150;
    state.gameActive = true;
    state.level = 1;

    // UI RESET FIX:
    document.getElementById('btn-restart-success').style.display = "block";
    updateHUD();

    document.querySelectorAll('.obstacle, .coin').forEach(el => el.remove());
    showScreen('game1');
    state.animationId = requestAnimationFrame(gameLoop1);
}

function gameLoop1() {
    if (!state.gameActive) return;
    state.frame++;

    // Physics
    state.playerVY += state.gravity;
    state.playerY += state.playerVY;
    if (state.playerY > 0) { state.playerY = 0; state.playerVY = 0; }
    elements.player.style.transform = `translateY(${state.playerY}px)`;

    // Spawn (every 120 frames)
    if (state.frame % 120 === 0) spawnObstacle();
    // Stop spawning coins if cap reached
    if (state.frame % 80 === 0 && state.currentLevelBalance < 1500) spawnCoin();

    // Move
    const containerW = getContainerWidth();
    state.obstacles.forEach((ob, i) => {
        ob.x -= state.speed;
        ob.el.style.left = ob.x + 'px';
        if (checkCollision(elements.player, ob.el)) gameOver("Маркетплейсы зло");
        if (ob.x < -100) { ob.el.remove(); state.obstacles.splice(i, 1); state.score += 50; updateHUD(); }
    });

    state.coins.forEach((c, i) => {
        c.x -= state.speed;
        c.el.style.left = c.x + 'px';
        if (checkCollision(elements.player, c.el)) {
            c.el.remove();
            state.coins.splice(i, 1);
            state.currentLevelBalance += 100;
            updateHUD();
        }
        if (c.x < -100) { c.el.remove(); state.coins.splice(i, 1); }
    });

    if (state.frame > 300) state.taxDistance += 0.12;
    elements.tax.style.left = state.taxDistance + 'px';
    // Tax catches player when it reaches ~10% from left (player is at 15%)
    const taxCatchX = containerW * 0.10;
    if (state.taxDistance >= taxCatchX) gameOver("Бравекто оплачено!");

    // Auto transition at 1500 balance
    if (state.currentLevelBalance >= 1500) {
        state.totalBalance += state.currentLevelBalance;
        levelSuccess();
    } else {
        state.animationId = requestAnimationFrame(gameLoop1);
    }
}

// LEVEL 2: QUEST
const quests = [
    {
        text: "Хочется подвигаться",
        options: [
            { text: "Хот Йога с подружками", balance: -300, feedback: "Отлично провели время, но нужно оплатить вход. (-300 ₽)" },
            { text: "Тренировка в солнечном", balance: 200, feedback: "И подвигались и заработали на шторы в новом доме. (+200 ₽)" }
        ]
    },
    {
        text: "Хочется искупаться",
        options: [
            { text: "Пойти кататься на катере", balance: 0, feedback: "Хорошо, что заправляет Саша. (+0 ₽)" },
            { text: "Дайвинг в новых ластах", balance: -200, feedback: "Глубоко ныряем в финансовую грамотность. (-200 ₽)" }
        ]
    },
    {
        text: "Хочется вкусняшку",
        options: [
            { text: "Пойти в пинтерест кофейню", balance: -300, feedback: "Вкусно, но грустно (-300 ₽)" },
            { text: "Испечь шарлотку дома", balance: 100, feedback: "Отлично, гости ушли довольные (+100 ₽)" }
        ]
    },
    {
        text: "Хочется путешествовать",
        options: [
            { text: "На источники в Тюмень", balance: -100, feedback: "Кожа мягкая, душа отдыхает (-100 ₽)" },
            { text: "Tomorrowland в Паттайе", balance: -10000, feedback: "Живем один раз (-10000 ₽)" }
        ]
    }
];

let currentQuest = 0;

function startLevel2() {
    state.level = 2;
    state.currentLevelBalance = 0;
    currentQuest = 0;
    document.getElementById('total-balance-2').innerText = state.totalBalance;
    showQuest();
    showScreen('game2');
}

function showQuest() {
    if (currentQuest >= quests.length) {
        state.totalBalance += state.currentLevelBalance; // Add Lvl 2 earned money to total
        levelSuccess();
        return;
    }

    const q = quests[currentQuest];
    document.getElementById('quest-text').innerText = q.text;
    document.getElementById('quest-btn-1').innerText = q.options[0].text;
    document.getElementById('quest-btn-2').innerText = q.options[1].text;
    document.getElementById('quest-feedback').innerText = "";

    document.getElementById('quest-btn-1').disabled = false;
    document.getElementById('quest-btn-2').disabled = false;
    document.getElementById('quest-btn-1').onclick = () => handleQuestChoice(0);
    document.getElementById('quest-btn-2').onclick = () => handleQuestChoice(1);
}

function handleQuestChoice(index) {
    document.getElementById('quest-btn-1').disabled = true;
    document.getElementById('quest-btn-2').disabled = true;

    const q = quests[currentQuest];
    const choice = q.options[index];
    state.currentLevelBalance += choice.balance;
    document.getElementById('total-balance-2').innerText = state.totalBalance + state.currentLevelBalance;
    document.getElementById('quest-feedback').innerText = choice.feedback;
    setTimeout(() => {
        currentQuest++;
        showQuest();
    }, 2000);
}

// LEVEL 3: CATCHER
function startLevel3() {
    state.level = 3;
    state.currentLevelBalance = 0;
    state.timer = 15;
    state.gameActive = true;
    state.fallingItems = [];
    state.frame = 0;
    document.getElementById('total-balance-3').innerText = state.totalBalance;
    document.getElementById('balance-3').innerText = 0;
    document.querySelectorAll('.falling-item').forEach(el => el.remove());

    // Center safe on start
    showScreen('game3');

    // Wait for layout to settle, then center the safe
    requestAnimationFrame(() => {
        const cw = getCatcherWidth();
        const sw = getSafeWidth();
        elements.safe.style.left = Math.floor((cw - sw) / 2) + 'px';
    });

    state.animationId = requestAnimationFrame(gameLoop3);

    state.timerInterval = setInterval(() => {
        state.timer--;
        document.getElementById('timer-3').innerText = state.timer;
        if (state.timer <= 0) {
            clearInterval(state.timerInterval);
            state.totalBalance += state.currentLevelBalance;
            showFinalWin();
        }
    }, 1000);
}

function gameLoop3() {
    if (!state.gameActive) return;
    if (state.frame % 35 === 0) spawnFallingItem();
    state.frame++;

    const containerH = elements.catcherContainer.offsetHeight || 600;

    state.fallingItems.forEach((item, i) => {
        item.y += 6;
        item.el.style.top = item.y + 'px';
        if (checkCollision(elements.safe, item.el)) {
            item.el.remove();
            state.fallingItems.splice(i, 1);
            state.currentLevelBalance += item.type === 'good' ? 100 : -200;
            document.getElementById('balance-3').innerText = state.currentLevelBalance;
            document.getElementById('total-balance-3').innerText = state.totalBalance + state.currentLevelBalance;
        } else if (item.y > containerH) {
            item.el.remove();
            state.fallingItems.splice(i, 1);
        }
    });

    if (state.timer > 0) state.animationId = requestAnimationFrame(gameLoop3);
}

function spawnFallingItem() {
    const item = document.createElement('div');
    const type = Math.random() > 0.3 ? 'good' : 'bad';
    item.className = `falling-item ${type === 'good' ? 'falling-money' : 'falling-bad'}`;
    item.innerText = type === 'good' ? '💵' : '🧨';
    const cw = getCatcherWidth();
    const itemSize = item.offsetWidth || 40;
    item.style.left = Math.random() * (cw - itemSize - 10) + 'px';
    item.style.top = '-50px';
    elements.catcherContainer.appendChild(item);
    state.fallingItems.push({ el: item, y: -50, type: type });
}

// HELPERS (Obstacles and Collision)
function spawnObstacle() {
    const ob = document.createElement('div');
    ob.className = 'obstacle';
    const texts = ["ПИЖАМКА", "ПОМАДА", "ТУФЛИ", "КОФЕЕК", "ТАЙ", "СПА", "КОНЦЕРТ", "ЦАЦКИ"];
    ob.innerText = texts[Math.floor(Math.random() * texts.length)];
    const x = getContainerWidth() + 10;
    ob.style.left = x + 'px';
    elements.gameContainer.appendChild(ob);
    state.obstacles.push({ el: ob, x: x });
}

function spawnCoin() {
    const c = document.createElement('div');
    c.className = 'coin';
    const x = getContainerWidth() + 10;
    c.style.left = x + 'px';
    elements.gameContainer.appendChild(c);
    state.coins.push({ el: c, x: x });
}

function checkCollision(a, b) {
    const r1 = a.getBoundingClientRect();
    const r2 = b.getBoundingClientRect();
    const padding = 5;
    return !(r1.top + padding > r2.bottom - padding || r1.bottom - padding < r2.top + padding || r1.right - padding < r2.left + padding || r1.left + padding > r2.right - padding);
}

function updateHUD() {
    elements.balance.innerText = state.currentLevelBalance;
    elements.score.innerText = state.score;

    const manualBtn = document.getElementById('btn-manual-finish');
    const hasReachedThreshold = (state.score >= 1000 || state.currentLevelBalance >= 1000);

    if (state.level === 1 && hasReachedThreshold) {
        manualBtn.style.display = 'block';
    } else {
        manualBtn.style.display = 'none';
    }
}

function gameOver(msg) {
    state.gameActive = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);
    if (state.timerInterval) clearInterval(state.timerInterval);

    elements.overMsg.innerText = msg;
    document.getElementById('fail-img').src = 'img/fail.png';

    const hasReachedThreshold = (state.score >= 1000 || state.currentLevelBalance >= 1000);
    const overNext = document.getElementById('btn-over-next');

    if (state.level === 1 && hasReachedThreshold) {
        overNext.style.display = 'block';
    } else {
        overNext.style.display = 'none';
    }

    showScreen('over');
}

function levelSuccess() {
    state.gameActive = false;
    if (state.animationId) cancelAnimationFrame(state.animationId);

    document.getElementById('success-balance').innerText = `Этот уровень принес: ${state.currentLevelBalance} ₽`;
    const msg = document.getElementById('success-message');
    const nextBtn = document.getElementById('btn-next-level');

    if (state.level === 1) {
        msg.innerText = "Минимум набран! Можно идти дальше.";
        nextBtn.style.display = "block";
        nextBtn.innerText = "К уровню 2: сложные решения";
    } else if (state.level === 2) {
        msg.innerText = "Мы прожили эту неделю! (" + state.currentLevelBalance + " ₽ к общему счету)";
        nextBtn.style.display = "block";
        nextBtn.innerText = "К уровню 3: мы делаем бизнес, мы делаем бабки";
        document.getElementById('btn-restart-success').style.display = "none";
    }
    showScreen('success');
}

function showFinalWin() {
    // Ensure final balance is capped at 5000
    state.totalBalance = Math.min(state.maxGift, state.totalBalance);
    elements.finalBalance.innerText = state.totalBalance;
    showScreen('win');
}

// Perform jump
function doJump() {
    if (state.playerY === 0 && state.gameActive && state.level === 1) {
        state.playerVY = state.jumpStrength;
    }
}

// EVENT LISTENERS
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        doJump();
    }
});

// Tap anywhere on game container to jump (Level 1)
elements.gameContainer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    doJump();
}, { passive: false });

// Jump button (dedicated mobile button)
const jumpBtn = document.getElementById('jump-btn');
jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    doJump();
}, { passive: false });
jumpBtn.addEventListener('click', () => doJump());

// Level 3: Mouse move safe control
elements.catcherContainer.addEventListener('mousemove', (e) => {
    if (state.level === 3 && state.gameActive) {
        const rect = elements.catcherContainer.getBoundingClientRect();
        const sw = getSafeWidth();
        let x = e.clientX - rect.left - sw / 2;
        x = Math.max(0, Math.min(rect.width - sw, x));
        elements.safe.style.left = x + 'px';
    }
});

// Level 3: Touch — drag safe with finger
elements.catcherContainer.addEventListener('touchmove', (e) => {
    if (state.level === 3 && state.gameActive) {
        e.preventDefault();
        const rect = elements.catcherContainer.getBoundingClientRect();
        const touch = e.touches[0];
        const sw = getSafeWidth();
        let x = touch.clientX - rect.left - sw / 2;
        x = Math.max(0, Math.min(rect.width - sw, x));
        elements.safe.style.left = x + 'px';
    }
}, { passive: false });

// Also handle touchstart so you can tap and immediately move
elements.catcherContainer.addEventListener('touchstart', (e) => {
    if (state.level === 3 && state.gameActive) {
        e.preventDefault();
        const rect = elements.catcherContainer.getBoundingClientRect();
        const touch = e.touches[0];
        const sw = getSafeWidth();
        let x = touch.clientX - rect.left - sw / 2;
        x = Math.max(0, Math.min(rect.width - sw, x));
        elements.safe.style.left = x + 'px';
    }
}, { passive: false });

function initButtons() {
    document.getElementById('btn-start').addEventListener('click', () => {
        state.totalBalance = 0; // Reset total on new run
        startLevel1();
    });

    document.getElementById('btn-restart').addEventListener('click', () => startLevel1());
    document.getElementById('btn-restart-success').addEventListener('click', () => startLevel1());

    document.getElementById('btn-manual-finish').addEventListener('click', () => {
        state.totalBalance += Math.min(state.currentLevelBalance, 1500); // Cap Lvl 1 contribution at 1500
        startLevel2();
    });

    document.getElementById('btn-over-next').addEventListener('click', () => {
        state.totalBalance += Math.min(state.currentLevelBalance, 1500);
        startLevel2();
    });

    document.getElementById('btn-next-level').addEventListener('click', () => {
        if (state.level === 1) {
            state.totalBalance += Math.min(state.currentLevelBalance, 1500);
            startLevel2();
        } else if (state.level === 2) {
            startLevel3();
        }
    });

    document.getElementById('btn-collect').addEventListener('click', () => {
        startLevel1();
    });
}

initButtons();
