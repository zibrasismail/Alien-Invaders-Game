const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameOverElement = document.getElementById("gameOver");
const playAgainButton = document.getElementById("playAgain");
const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const powerUpElement = document.getElementById("powerUp");
const pausePlayButton = document.getElementById("pausePlay");

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameOver = false;
let paused = false;
let score = 0;
let level = 1;
let powerUp = null;
let alienSpeedMultiplier = 0.5; // Start with a lower speed multiplier

const player = {
  x: CANVAS_WIDTH / 2 - 37.5, // Adjusted for new width
  y: CANVAS_HEIGHT - 90, // Adjusted for new height
  width: 75, // Increased width
  height: 60, // Increased height
  speed: 5,
  image: new Image(),
};

player.image.src = "assets/space.png"; // Player image
player.image.onerror = () => console.error("Failed to load player image");

const bullets = [];
const aliens = [];
const keys = {};

// Create an audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to play shooting sound
function playShootingSound() {
  if (paused) return; // Do not play sound if paused

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frequency in Hz
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volume

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // Play sound for 0.1 seconds
}

function createAlien(type = "normal") {
  const alienImage = new Image();
  alienImage.src = "assets/enemy.png"; // Alien image
  alienImage.onerror = () => console.error("Failed to load alien image");

  return {
    x: Math.random() * (CANVAS_WIDTH - 40),
    y: 0,
    width: type === "boss" ? 80 : 40,
    height: type === "boss" ? 80 : 40,
    speed:
      (type === "boss" ? 1 : 1 + Math.random() * 1.5) * alienSpeedMultiplier,
    type: type,
    health: type === "boss" ? 5 : 1,
    image: alienImage,
  };
}

function drawPlayer() {
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
}

function drawAlien(alien) {
  if (alien.image.complete && alien.image.naturalWidth !== 0) {
    ctx.drawImage(alien.image, alien.x, alien.y, alien.width, alien.height);
  } else {
    console.error("Alien image not loaded correctly");
  }
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function update() {
  if (gameOver || paused) return;

  // Player movement
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x < CANVAS_WIDTH - player.width) {
    player.x += player.speed;
  }

  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) {
      bullets.splice(index, 1);
    }
  });

  // Update aliens
  aliens.forEach((alien, alienIndex) => {
    alien.y += alien.speed;
    if (alien.y > CANVAS_HEIGHT) {
      aliens.splice(alienIndex, 1);
      gameOver = true;
      gameOverElement.style.display = "block";
    }

    // Collision detection
    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < alien.x + alien.width &&
        bullet.x + bullet.width > alien.x &&
        bullet.y < alien.y + alien.height &&
        bullet.y + bullet.height > alien.y
      ) {
        bullets.splice(bulletIndex, 1);
        alien.health--;
        if (alien.health <= 0) {
          aliens.splice(alienIndex, 1);
          score += alien.type === "boss" ? 50 : 10;
          scoreElement.textContent = `Score: ${score}`;
        }
      }
    });
  });

  // Spawn new aliens
  if (Math.random() < 0.02) {
    aliens.push(createAlien());
  }

  // Spawn boss
  if (
    score > 0 &&
    score % 100 === 0 &&
    !aliens.some((alien) => alien.type === "boss")
  ) {
    aliens.push(createAlien("boss"));
  }

  // Level up
  if (score > level * 100) {
    level++;
    levelElement.textContent = `Level: ${level}`;
    player.speed += 0.5;
    alienSpeedMultiplier += 0.05; // Increase alien speed multiplier more slowly
  }

  // Power-up
  if (Math.random() < 0.001) {
    powerUp = Math.random() < 0.5 ? "spread" : "rapid";
    powerUpElement.textContent = `Power-up: ${powerUp}`;
    setTimeout(() => {
      powerUp = null;
      powerUpElement.textContent = "Power-up: None";
    }, 5000);
  }
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw player
  drawPlayer();

  // Draw bullets
  bullets.forEach((bullet) => {
    drawRect(bullet.x, bullet.y, bullet.width, bullet.height, bullet.color);
  });

  // Draw aliens
  aliens.forEach((alien) => {
    drawAlien(alien);
  });
}

function gameLoop() {
  if (!gameOver && !paused) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

function handleKeyDown(e) {
  if (paused) return; // Do not handle key down if paused

  keys[e.key] = true;
  if (e.key === " ") {
    shootBullet();
  }
}

function handleKeyUp(e) {
  if (paused) return; // Do not handle key up if paused

  keys[e.key] = false;
}

function handleMouseMove(e) {
  if (paused) return; // Do not handle mouse move if paused

  const rect = canvas.getBoundingClientRect();
  player.x = e.clientX - rect.left - player.width / 2;
}

function handleMouseClick() {
  if (paused) return; // Do not handle mouse click if paused

  shootBullet();
}

function shootBullet() {
  if (paused) return; // Do not shoot if paused

  console.log("Shooting bullet"); // Debug log
  playShootingSound(); // Play shooting sound when shooting

  if (powerUp === "spread") {
    for (let i = -1; i <= 1; i++) {
      bullets.push({
        x: player.x + player.width / 2 - 2.5 + i * 10,
        y: player.y,
        width: 5,
        height: 10,
        color: "#ffff00",
        speed: 7,
      });
    }
  } else if (powerUp === "rapid") {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        bullets.push({
          x: player.x + player.width / 2 - 2.5,
          y: player.y,
          width: 5,
          height: 10,
          color: "#ffff00",
          speed: 7,
        });
      }, i * 100);
    }
  } else {
    bullets.push({
      x: player.x + player.width / 2 - 2.5,
      y: player.y,
      width: 5,
      height: 10,
      color: "#ffff00",
      speed: 7,
    });
  }
}

function resetGame() {
  gameOver = false;
  paused = false;
  score = 0;
  level = 1;
  powerUp = null;
  alienSpeedMultiplier = 0.5; // Reset alien speed multiplier
  player.x = CANVAS_WIDTH / 2 - 37.5; // Adjusted for new width
  player.y = CANVAS_HEIGHT - 90; // Adjusted for new height
  bullets.length = 0;
  aliens.length = 0;
  gameOverElement.style.display = "none";
  scoreElement.textContent = `Score: ${score}`;
  levelElement.textContent = `Level: ${level}`;
  powerUpElement.textContent = "Power-up: None";
  gameLoop();
}

function togglePausePlay() {
  paused = !paused;
  pausePlayButton.textContent = paused ? "Play" : "Pause";
  if (!paused) {
    gameLoop();
  }
}

playAgainButton.addEventListener("click", resetGame);
pausePlayButton.addEventListener("click", togglePausePlay);

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("click", handleMouseClick);

gameLoop();
