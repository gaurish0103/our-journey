// ===== ELEMENTS =====
var introScreen = document.getElementById("introScreen");
var gameScreen = document.getElementById("gameScreen");
var player = document.getElementById("player");
var memoryItem = document.getElementById("memoryItem");
var levelTitle = document.getElementById("levelTitle");
var levelHint = document.getElementById("levelHint");
var popup = document.getElementById("popup");
var popupYear = document.getElementById("popupYear");
var popupEmoji = document.getElementById("popupEmoji");
var yearMessage = document.getElementById("yearMessage");
var finalScreen = document.getElementById("finalScreen");
var dragHint = document.getElementById("dragHint");

// ===== GAME STATE =====
var x = 10;
var y = 10;
var score = 0;
var gameActive = false;
var gameWidth = 320;
var gameHeight = 320;
var isDragging = false;
var dragOffsetX = 0;
var dragOffsetY = 0;

// ===== YEAR DATA =====
var yearData = [
  {
    emoji: "\uD83E\uDDE1",
    title: "Year 1",
    message: "We met... and everything changed.\nTwo strangers who didn't know\nthey were about to become everything to each other."
  },
  {
    emoji: "\uD83C\uDF38",
    title: "Year 2",
    message: "We built our own little world.\nLate night talks, inside jokes,\nand a comfort I never found anywhere else."
  },
  {
    emoji: "\uD83E\uDD8B",
    title: "Year 3",
    message: "We became each other's home.\nNot a place, but a feeling —\nsafe, warm, and always yours."
  },
  {
    emoji: "\uD83C\uDF3C",
    title: "Year 4",
    message: "We learned to love quietly too.\nIn silences, in small things,\nin just being next to each other."
  },
  {
    emoji: "\uD83C\uDF1C",
    title: "Year 5",
    message: "We made ordinary days feel magical.\nEvery moment with you became\na memory I never want to forget."
  },
  {
    emoji: "\uD83D\uDC9E",
    title: "Year 6",
    message: "6 years later... I still get butterflies.\nYou're my best friend, my peace,\nand my everything."
  }
];

var backgroundGradients = [
  "linear-gradient(135deg, #ffdde1 0%, #ee9ca7 50%, #ff6b6b 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 50%, #c2a0d5 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f5576c 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #feada6 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 50%, #ff6b8a 100%)",
  "linear-gradient(135deg, #ff6b8a 0%, #ff4d6d 50%, #c2185b 100%)"
];

// ===== START GAME =====
function startGame() {
  introScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameActive = true;
  updateGameSize();
  placeMemory();

  // Try to play music
  var music = document.getElementById("bgMusic");
  music.play().catch(function () {});
}

// ===== TOUCH DRAG =====
player.addEventListener("touchstart", function (e) {
  if (!gameActive || !popup.classList.contains("hidden")) return;
  e.preventDefault();

  isDragging = true;
  player.classList.add("dragging");

  // Hide the drag hint after first touch
  if (dragHint) dragHint.classList.add("hide");

  var touch = e.touches[0];
  var gameRect = document.getElementById("game").getBoundingClientRect();
  dragOffsetX = touch.clientX - gameRect.left - x;
  dragOffsetY = touch.clientY - gameRect.top - y;
}, { passive: false });

document.addEventListener("touchmove", function (e) {
  if (!isDragging) return;
  e.preventDefault();

  var touch = e.touches[0];
  var gameRect = document.getElementById("game").getBoundingClientRect();

  x = touch.clientX - gameRect.left - dragOffsetX;
  y = touch.clientY - gameRect.top - dragOffsetY;

  applyPosition();
  spawnTrail();
  checkCollision();
}, { passive: false });

document.addEventListener("touchend", function () {
  if (!isDragging) return;
  isDragging = false;
  player.classList.remove("dragging");
});

// Also allow dragging anywhere on the game board (not just on the heart)
(function () {
  var gameEl = document.getElementById("game");

  gameEl.addEventListener("touchstart", function (e) {
    if (!gameActive || !popup.classList.contains("hidden")) return;
    // Only if touch didn't start on the player itself
    if (e.target === player || player.contains(e.target)) return;
    e.preventDefault();

    isDragging = true;
    player.classList.add("dragging");
    if (dragHint) dragHint.classList.add("hide");

    var touch = e.touches[0];
    var gameRect = gameEl.getBoundingClientRect();

    // Move player to where the finger is
    x = touch.clientX - gameRect.left - 18;
    y = touch.clientY - gameRect.top - 18;
    dragOffsetX = 18;
    dragOffsetY = 18;

    applyPosition();
    checkCollision();
  }, { passive: false });
})();

// ===== MOUSE DRAG (for desktop testing) =====
player.addEventListener("mousedown", function (e) {
  if (!gameActive || !popup.classList.contains("hidden")) return;
  e.preventDefault();

  isDragging = true;
  player.classList.add("dragging");

  var gameRect = document.getElementById("game").getBoundingClientRect();
  dragOffsetX = e.clientX - gameRect.left - x;
  dragOffsetY = e.clientY - gameRect.top - y;
});

document.addEventListener("mousemove", function (e) {
  if (!isDragging) return;

  var gameRect = document.getElementById("game").getBoundingClientRect();
  x = e.clientX - gameRect.left - dragOffsetX;
  y = e.clientY - gameRect.top - dragOffsetY;

  applyPosition();
  spawnTrail();
  checkCollision();
});

document.addEventListener("mouseup", function () {
  if (!isDragging) return;
  isDragging = false;
  player.classList.remove("dragging");
});

// ===== KEYBOARD (still works on desktop) =====
document.addEventListener("keydown", function (e) {
  if (!gameActive || !popup.classList.contains("hidden")) return;

  var step = 15;
  if (e.key === "ArrowRight" || e.key === "d") x += step;
  if (e.key === "ArrowLeft" || e.key === "a") x -= step;
  if (e.key === "ArrowUp" || e.key === "w") y -= step;
  if (e.key === "ArrowDown" || e.key === "s") y += step;

  e.preventDefault();
  applyPosition();
  spawnTrail();
  checkCollision();
});

// ===== POSITION =====
function applyPosition() {
  var maxX = gameWidth - 40;
  var maxY = gameHeight - 40;
  x = Math.max(5, Math.min(x, maxX));
  y = Math.max(5, Math.min(y, maxY));

  player.style.left = x + "px";
  player.style.top = y + "px";
}

// ===== TRAIL PARTICLES =====
var trailThrottle = 0;
function spawnTrail() {
  var now = Date.now();
  if (now - trailThrottle < 50) return; // limit trail frequency on mobile
  trailThrottle = now;

  var game = document.getElementById("game");
  var dot = document.createElement("div");
  dot.className = "trail-particle";
  dot.style.left = (x + 15) + "px";
  dot.style.top = (y + 15) + "px";
  game.appendChild(dot);
  setTimeout(function () { dot.remove(); }, 600);
}

// ===== COLLISION =====
function checkCollision() {
  var pr = player.getBoundingClientRect();
  var mr = memoryItem.getBoundingClientRect();

  var overlap = !(pr.right < mr.left || pr.left > mr.right || pr.bottom < mr.top || pr.top > mr.bottom);

  if (overlap) {
    isDragging = false;
    player.classList.remove("dragging");
    gameActive = false;

    // Vibrate on collect (mobile haptic feedback)
    if (navigator.vibrate) navigator.vibrate(100);

    showPopup();
  }
}

// ===== POPUP =====
function showPopup() {
  var data = yearData[score];
  popupYear.textContent = data.title;
  popupEmoji.textContent = data.emoji;
  yearMessage.textContent = "";
  popup.classList.remove("hidden");

  // Typewriter effect
  var text = data.message;
  var i = 0;
  function type() {
    if (i < text.length) {
      yearMessage.textContent += text.charAt(i);
      i++;
      setTimeout(type, 30);
    }
  }
  setTimeout(type, 400);
}

function closePopup() {
  popup.classList.add("hidden");

  // Fill progress heart
  var heart = document.getElementById("ph" + score);
  if (heart) {
    heart.innerHTML = "&#10084;";
    heart.classList.add("filled");
  }

  // Vibrate on progress
  if (navigator.vibrate) navigator.vibrate(50);

  score++;

  if (score >= 6) {
    showFinalScreen();
  } else {
    // Next level
    document.body.style.background = backgroundGradients[score];
    levelTitle.textContent = yearData[score].title;
    memoryItem.textContent = yearData[score].emoji;
    placeMemory();

    // Reset player to center-bottom
    x = gameWidth / 2 - 18;
    y = gameHeight - 55;
    player.style.left = x + "px";
    player.style.top = y + "px";
    gameActive = true;
  }
}

// ===== PLACE MEMORY =====
function placeMemory() {
  var margin = 50;
  // Place memory in top half so player drags upward
  var newLeft = margin + Math.random() * (gameWidth - margin * 2);
  var newTop = margin + Math.random() * (gameHeight / 2 - margin);
  memoryItem.style.left = newLeft + "px";
  memoryItem.style.top = newTop + "px";
}

// ===== GAME SIZE =====
function updateGameSize() {
  var gameEl = document.getElementById("game");
  gameWidth = gameEl.offsetWidth;
  gameHeight = gameEl.offsetHeight;
}

window.addEventListener("resize", function () {
  updateGameSize();
});

// ===== FINAL SCREEN =====
function showFinalScreen() {
  gameScreen.classList.add("hidden");
  finalScreen.classList.remove("hidden");
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  startFireworks();
}

// ===== FIREWORKS =====
function startFireworks() {
  var canvas = document.getElementById("fireworks");
  var ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var particles = [];

  function Particle(px, py, color) {
    this.x = px;
    this.y = py;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.radius = Math.random() * 3 + 1;
  }

  function explode(cx, cy) {
    var hue = Math.random() * 60 + 320;
    for (var i = 0; i < 60; i++) {
      var color = "hsl(" + (hue + Math.random() * 40) + ", 100%, " + (60 + Math.random() * 30) + "%)";
      particles.push(new Particle(cx, cy, color));
    }
  }

  function animate() {
    ctx.fillStyle = "rgba(13, 0, 21, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  animate();

  function launchFirework() {
    var fx = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    var fy = Math.random() * canvas.height * 0.5 + canvas.height * 0.1;
    explode(fx, fy);
  }

  for (var i = 0; i < 5; i++) {
    setTimeout(launchFirework, i * 300);
  }

  setInterval(function () {
    launchFirework();
    if (Math.random() > 0.5) {
      setTimeout(launchFirework, 200);
    }
  }, 800);

  window.addEventListener("resize", function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ===== FLOATING HEARTS BACKGROUND =====
var heartEmojis = ["\u2764", "\uD83D\uDC95", "\uD83D\uDC96", "\uD83D\uDC97", "\u2665"];

setInterval(function () {
  var heart = document.createElement("div");
  heart.classList.add("floating-heart");
  heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  heart.style.left = Math.random() * window.innerWidth + "px";
  heart.style.fontSize = (14 + Math.random() * 14) + "px";
  heart.style.animationDuration = (6 + Math.random() * 6) + "s";
  document.getElementById("floatingHearts").appendChild(heart);
  setTimeout(function () { heart.remove(); }, 12000);
}, 1200);

// ===== PREVENT PAGE SCROLL/BOUNCE ON MOBILE =====
document.body.addEventListener("touchmove", function (e) {
  if (isDragging) {
    e.preventDefault();
  }
}, { passive: false });
