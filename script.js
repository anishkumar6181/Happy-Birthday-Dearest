/* ===================================================
   BIRTHDAY WEBSITE — script.js
   Interactive features: balloons, hearts, confetti,
   lightbox, quiz, secret message, fireworks, cake
   =================================================== */

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  spawnBalloons();
  spawnHearts();
  launchPageConfetti();
  initQuiz();
  autoStartMusic();
});

// ===========================
// SMOOTH SCROLL
// ===========================
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ===========================
// BIRTHDAY MUSIC (Web Audio API)
// Plays "Happy Birthday to You" as a piano/music-box melody
// Works 100% offline — no external files needed
// ===========================
let audioCtx = null;
let musicPlaying = false;
let musicLoopTimeout = null;
const musicBtn = document.getElementById('music-toggle');

// Note frequencies (Hz)
const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.00,
  REST: 0
};

// Happy Birthday melody: [note, duration_in_beats]
// Tempo: ~100bpm → 1 beat = 0.6s
const TEMPO = 0.52; // seconds per beat
const MELODY = [
  // "Hap-py Birth-day to you"
  [NOTE.C4, 0.75], [NOTE.C4, 0.25], [NOTE.D4, 1],   [NOTE.C4, 1],   [NOTE.F4, 1],   [NOTE.E4, 2],
  // "Hap-py Birth-day to you"
  [NOTE.C4, 0.75], [NOTE.C4, 0.25], [NOTE.D4, 1],   [NOTE.C4, 1],   [NOTE.G4, 1],   [NOTE.F4, 2],
  // "Hap-py Birth-day dear Sis-ter"
  [NOTE.C4, 0.75], [NOTE.C4, 0.25], [NOTE.C5, 1],   [NOTE.A4, 1],   [NOTE.F4, 1],   [NOTE.E4, 1],  [NOTE.D4, 2],
  // "Hap-py Birth-day to you"
  [NOTE.B4, 0.75], [NOTE.B4, 0.25], [NOTE.A4, 1],   [NOTE.F4, 1],   [NOTE.G4, 1],   [NOTE.F4, 2],
  // Pause before loop
  [NOTE.REST, 3]
];

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser policy)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playNote(ctx, freq, startTime, duration, volume = 0.18) {
  if (freq === 0) return; // REST

  // Oscillator (piano-like timbre)
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startTime);

  // Second harmonic for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  // ADSR envelope gain
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);        // Attack
  gain.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + 0.08); // Decay
  gain.gain.setValueAtTime(volume * 0.5, startTime + duration * TEMPO - 0.08); // Sustain
  gain.gain.linearRampToValueAtTime(0.001, startTime + duration * TEMPO - 0.01); // Release

  const gain2 = ctx.createGain();
  gain2.gain.value = volume * 0.3;

  // Reverb-like echo: extra gain node with small delay
  const delay = ctx.createDelay(0.3);
  delay.delayTime.value = 0.15;
  const delayGain = ctx.createGain();
  delayGain.gain.value = 0.12;

  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(ctx.destination);
  gain2.connect(ctx.destination);
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration * TEMPO + 0.05);
  osc2.start(startTime);
  osc2.stop(startTime + duration * TEMPO + 0.05);
}

function playBirthdaySong() {
  const ctx = getAudioCtx();
  let t = ctx.currentTime + 0.1;

  MELODY.forEach(([note, beats]) => {
    playNote(ctx, note, t, beats);
    t += beats * TEMPO;
  });

  // Loop: schedule next play just before this one ends
  const totalDuration = MELODY.reduce((sum, [, b]) => sum + b * TEMPO, 0) * 1000;
  musicLoopTimeout = setTimeout(() => {
    if (musicPlaying) playBirthdaySong();
  }, totalDuration - 200);
}

function autoStartMusic() {
  document.addEventListener('click', () => {
    if (!musicPlaying) {
      startBirthdayMusic();
    }
  }, { once: true });
}

function startBirthdayMusic() {
  musicPlaying = true;
  musicBtn.textContent = '🎵';
  playBirthdaySong();
}

function toggleMusic() {
  if (musicPlaying) {
    musicPlaying = false;
    musicBtn.textContent = '🔇';
    clearTimeout(musicLoopTimeout);
    // Fade out by closing context temporarily
    if (audioCtx) audioCtx.suspend();
  } else {
    if (audioCtx) audioCtx.resume();
    musicPlaying = true;
    musicBtn.textContent = '🎵';
    playBirthdaySong();
  }
}

// ===========================
// FLOATING BALLOONS
// ===========================
const balloonEmojis = ['🎈', '🎀', '🎊', '🌸', '💜', '🩷', '⭐', '🌟'];

function spawnBalloons() {
  const container = document.getElementById('balloons-container');
  const count = 14;

  for (let i = 0; i < count; i++) {
    setTimeout(() => createBalloon(container), i * 600);
  }
  // Keep spawning
  setInterval(() => createBalloon(container), 2200);
}

function createBalloon(container) {
  const b = document.createElement('div');
  b.className = 'balloon';
  b.textContent = balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)];
  b.style.left = Math.random() * 100 + '%';
  const dur = 8 + Math.random() * 7;
  b.style.animationDuration = dur + 's';
  b.style.fontSize = (2 + Math.random() * 2) + 'rem';
  b.style.animationDelay = (Math.random() * 2) + 's';
  container.appendChild(b);
  setTimeout(() => b.remove(), (dur + 3) * 1000);
}

// ===========================
// FLOATING HEARTS
// ===========================
const heartEmojis = ['❤️', '💕', '💖', '💗', '💓', '💝', '🩷', '💞'];

function spawnHearts() {
  setInterval(() => {
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    h.style.left = Math.random() * 100 + '%';
    const dur = 6 + Math.random() * 8;
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = '0s';
    h.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
    document.getElementById('hearts-container').appendChild(h);
    setTimeout(() => h.remove(), (dur + 1) * 1000);
  }, 1200);
}

// ===========================
// CONFETTI (Canvas-based)
// ===========================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];
let confettiActive = false;
let confettiRaf = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const confettiColors = ['#ff6eb4', '#9b59b6', '#f4c430', '#a855f7', '#ec4899', '#ffffff', '#fbbf24'];

function createConfettiParticles(count = 120) {
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      w: 8 + Math.random() * 8,
      h: 14 + Math.random() * 10,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      vy: 2.5 + Math.random() * 3,
      vx: (Math.random() - 0.5) * 2.5,
      opacity: 1
    });
  }
}

function animateConfetti() {
  if (!confettiActive) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confettiParticles.forEach((p, i) => {
    p.y += p.vy;
    p.x += p.vx;
    p.rot += p.rotSpeed;
    if (p.y > canvas.height) p.opacity -= 0.02;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });

  confettiParticles = confettiParticles.filter(p => p.opacity > 0);

  if (confettiParticles.length > 0) {
    confettiRaf = requestAnimationFrame(animateConfetti);
  } else {
    confettiActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function launchConfetti(count = 180) {
  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  confettiActive = true;
  createConfettiParticles(count);
  animateConfetti();
}

function launchPageConfetti() {
  setTimeout(() => launchConfetti(120), 800);
}

// ===========================
// LIGHTBOX
// ===========================
const galleryData = [
  { src: 'images/group.jpg',  fallback: 'https://picsum.photos/seed/sisters1/800/600',  caption: 'Our childhood fights 😂' },
  { src: 'images/family.jpeg',     fallback: 'https://picsum.photos/seed/travel22/800/600',  caption: 'Our family ❤️' },
  { src: 'images/sister.jpeg',  fallback: 'https://picsum.photos/seed/sisters3/800/600',  caption: 'Best Moments ❤️' },
  { src: 'images/birhday.jpeg',   fallback: 'https://picsum.photos/seed/birthday44/800/600',caption: 'Crazy birthday parties 🎉' },
  { src: 'images/school.jpeg', fallback: 'https://picsum.photos/seed/sisters55/800/600', caption: 'Those school day memories 📚' },
  { src: 'images/friends.jpeg',    fallback: 'https://picsum.photos/seed/fun66/800/600',     caption: 'your favorite 🤪' }
];

let currentLightboxIdx = 0;

function openLightbox(idx) {
  currentLightboxIdx = idx;
  updateLightbox();
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function updateLightbox() {
  const data = galleryData[currentLightboxIdx];
  const img = document.getElementById('lightbox-img');
  img.onerror = function() {
    this.onerror = null;
    this.src = data.fallback;
  };
  img.src = data.src;
  document.getElementById('lightbox-caption').textContent = data.caption;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

function changeLightbox(dir) {
  currentLightboxIdx = (currentLightboxIdx + dir + galleryData.length) % galleryData.length;
  updateLightbox();
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft')  changeLightbox(-1);
    if (e.key === 'ArrowRight') changeLightbox(1);
    if (e.key === 'Escape')     closeLightbox();
  }
  const sm = document.getElementById('secret-modal');
  if (!sm.classList.contains('hidden') && e.key === 'Escape') closeSecretModal();
});

// ===========================
// QUIZ GAME
// ===========================
const quizQuestions = [
  {
    photo: 'https://picsum.photos/seed/quiz1/700/300',
    photoLabel: '🏠 Home Sweet Home',
    question: 'What is the name of our childhood neighbourhood where we grew up together?',
    answer: 'home',
    hint: 'Think of the place that always feels like "home" 🏠'
  },
  {
    photo: 'https://picsum.photos/seed/quiz2/700/300',
    photoLabel: '🍕 Food Time!',
    question: 'What is your absolute favourite food that you could eat every single day? 😋',
    answer: 'chocolava',
    hint: ' French dessert, Round, and totally delicious! 🍕'
  },
  {
    photo: 'https://picsum.photos/seed/quiz3/700/300',
    photoLabel: '✈️ Travel Dreams',
    question: 'What is the dream destination you have always wanted to visit? 🌍',
    answer: 'Manali',
    hint: 'Himalayan resort town nestled in the Beas River valley'
  },
  {
    photo: 'https://picsum.photos/seed/quiz4/700/300',
    photoLabel: '🎬 Movie Night',
    question: 'What is your all-time favourite movie that you have watched a hundred times? 🎬',
    answer: 'My grilfriend is an alien',
    hint: 'Think of the one that always makes you cry and laugh! 🎭'
  },
  {
    photo: 'https://picsum.photos/seed/quiz5/700/300',
    photoLabel: '🌟 Your Nick Name',
    question: 'What is the cute nickname everyone calls you? ⭐',
    answer: 'kabbo',
    hint: 'use this name when I’m being sweet to you.💫'
  },
  {

  }
];

let currentQuestion = 0;
let correctAnswers = 0;
let quizCompleted = false;

function initQuiz() {
  showQuestion(0);
}

function showQuestion(idx) {
  if (idx >= quizQuestions.length) {
    showQuizResult();
    return;
  }

  const q = quizQuestions[idx];
  document.getElementById('quiz-question').textContent = q.question;
  document.getElementById('quiz-answer').value = '';
  document.getElementById('quiz-answer').disabled = false;

  const feedback = document.getElementById('quiz-feedback');
  feedback.classList.add('hidden');
  feedback.classList.remove('correct', 'wrong');

  const progress = ((idx) / quizQuestions.length) * 100;
  document.getElementById('quiz-progress-fill').style.width = progress + '%';
  document.getElementById('quiz-progress-text').textContent = `Question ${idx + 1} of ${quizQuestions.length}`;

  // Animate card
  const card = document.getElementById('quiz-card');
  card.style.animation = 'none';
  card.offsetHeight; // reflow
  card.style.animation = 'slide-up 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)';

  document.getElementById('quiz-card').classList.remove('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
}

function checkAnswer() {
  if (quizCompleted) return;

  const userInput = document.getElementById('quiz-answer').value.trim().toLowerCase();
  if (!userInput) {
    shakeInput();
    return;
  }

  const q = quizQuestions[currentQuestion];
  const feedback = document.getElementById('quiz-feedback');

  // Accept any non-empty answer (it's a fun quiz!) but compare for "correct"
  const isCorrect = userInput.includes(q.answer) || q.answer.includes(userInput);

  feedback.classList.remove('hidden', 'correct', 'wrong');
  document.getElementById('quiz-answer').disabled = true;

  if (isCorrect) {
    correctAnswers++;
    feedback.classList.add('correct');
    feedback.textContent = '🎉 Amazing! You got it right! 🎊';
  } else {
    feedback.classList.add('wrong');
    feedback.textContent = `Hint: ${q.hint}`;
  }

  setTimeout(() => {
    currentQuestion++;
    showQuestion(currentQuestion);
  }, 2500);
}

function skipQuestion() {
  currentQuestion++;
  showQuestion(currentQuestion);
}

function shakeInput() {
  const input = document.getElementById('quiz-answer');
  input.style.animation = 'none';
  input.offsetHeight;
  input.style.animation = 'shake 0.4s ease';
  input.addEventListener('animationend', () => {
    input.style.animation = '';
  }, { once: true });
}

function showQuizResult() {
  quizCompleted = true;
  document.getElementById('quiz-card').classList.add('hidden');
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');

  document.getElementById('quiz-progress-fill').style.width = '100%';
  document.getElementById('quiz-progress-text').textContent = 'Quiz Complete! 🎉';

  const ratio = correctAnswers / quizQuestions.length;
  let emoji, title, msg;

  if (ratio >= 0.8) {
    emoji = '🏆'; title = 'You\'re a genius!';
    msg = `You got ${correctAnswers} out of ${quizQuestions.length} correct! You really know yourself (and us)! 🌟`;
  } else if (ratio >= 0.5) {
    emoji = '😄'; title = 'Not bad at all!';
    msg = `${correctAnswers} out of ${quizQuestions.length}! Pretty good! Life is full of surprises 😂`;
  } else {
    emoji = '🥳'; title = 'You had fun though!';
    msg = `${correctAnswers} out of ${quizQuestions.length}. But who cares — you played! That\'s what matters! ❤️`;
  }

  document.getElementById('quiz-result-emoji').textContent = emoji;
  document.getElementById('quiz-result-title').textContent = title;
  document.getElementById('quiz-result-msg').textContent = msg;

  launchConfetti(100);
}

function restartQuiz() {
  currentQuestion = 0;
  correctAnswers = 0;
  quizCompleted = false;
  initQuiz();
}

// Shake keyframe (added dynamically)
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}`;
document.head.appendChild(shakeStyle);

// Enter key to submit quiz
document.getElementById('quiz-answer').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkAnswer();
});

// ===========================
// SECRET MESSAGE
// ===========================
const secretMessage = `Dear Sister,

Thank you for being my best friend and partner in crime.
You've been there through every high and low, every laugh and tear.
Life wouldn't be the same without you.
You are strong, beautiful, kind, and absolutely amazing.
I wish you all the happiness, success, love, and adventure in the world.
Happy Birthday! You deserve every bit of joy coming your way.
I love you more than words can say. ❤️`;

let typingInterval = null;

function openSecretMessage() {
  document.getElementById('secret-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const textEl = document.getElementById('secret-typed-text');
  textEl.innerHTML = '';

  if (typingInterval) clearInterval(typingInterval);

  let i = 0;
  const chars = secretMessage.split('');

  typingInterval = setInterval(() => {
    if (i < chars.length) {
      if (chars[i] === '\n') {
        textEl.innerHTML += '<br/>';
      } else {
        textEl.innerHTML += chars[i];
      }
      i++;
      // Auto scroll text el
      textEl.scrollTop = textEl.scrollHeight;
    } else {
      clearInterval(typingInterval);
      // Add blinking cursor after done
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      textEl.appendChild(cursor);
    }
  }, 38);
}

function closeSecretModal() {
  document.getElementById('secret-modal').classList.add('hidden');
  document.body.style.overflow = '';
  if (typingInterval) clearInterval(typingInterval);
}

// ===========================
// BIRTHDAY FINALE — BLOW CANDLES
// ===========================
let candlesBlown = false;

function blowCandles() {
  if (candlesBlown) return;
  candlesBlown = true;

  const flames = document.querySelectorAll('.flame');
  flames.forEach((flame, i) => {
    setTimeout(() => {
      flame.classList.add('extinguished');
    }, i * 200);
  });

  // Show finale message after all candles out
  setTimeout(() => {
    document.getElementById('blow-btn').classList.add('hidden');
    document.getElementById('finale-message').classList.remove('hidden');
    launchFireworks();
    launchConfetti(300);

    // Burst of hearts
    for (let i = 0; i < 20; i++) {
      setTimeout(spawnFinaleHeart, i * 100);
    }
  }, flames.length * 200 + 600);
}

function spawnFinaleHeart() {
  const h = document.createElement('div');
  h.className = 'heart';
  h.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  h.style.left = Math.random() * 100 + '%';
  h.style.animationDuration = (4 + Math.random() * 4) + 's';
  h.style.fontSize = (1 + Math.random() * 2) + 'rem';
  document.getElementById('hearts-container').appendChild(h);
  setTimeout(() => h.remove(), 8000);
}

// ===========================
// FIREWORKS
// ===========================
const fwCanvas = document.getElementById('fireworks-canvas');
const fwCtx = fwCanvas.getContext('2d');
let fwParticles = [];
let fwActive = false;
let fwRaf = null;

function resizeFwCanvas() {
  fwCanvas.width = fwCanvas.offsetWidth;
  fwCanvas.height = fwCanvas.offsetHeight;
}

function launchFireworks() {
  resizeFwCanvas();
  fwActive = true;
  fwParticles = [];

  // Launch bursts
  let bursts = 0;
  const burstInterval = setInterval(() => {
    launchBurst();
    bursts++;
    if (bursts >= 12) clearInterval(burstInterval);
  }, 500);

  animateFireworks();
}

function launchBurst() {
  const x = fwCanvas.width * (0.2 + Math.random() * 0.6);
  const y = fwCanvas.height * (0.1 + Math.random() * 0.5);
  const count = 60 + Math.floor(Math.random() * 40);
  const hue = Math.random() * 360;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i;
    const speed = 3 + Math.random() * 5;
    fwParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.012 + Math.random() * 0.01,
      size: 3 + Math.random() * 4,
      color: `hsl(${hue + Math.random() * 60}, 100%, 65%)`
    });
  }
}

function animateFireworks() {
  if (!fwActive) return;

  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);

  fwParticles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // gravity
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.life -= p.decay;

    fwCtx.save();
    fwCtx.globalAlpha = Math.max(0, p.life);
    fwCtx.fillStyle = p.color;
    fwCtx.shadowColor = p.color;
    fwCtx.shadowBlur = 8;
    fwCtx.beginPath();
    fwCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    fwCtx.fill();
    fwCtx.restore();
  });

  fwParticles = fwParticles.filter(p => p.life > 0);
  fwRaf = requestAnimationFrame(animateFireworks);
}

// Resize fireworks canvas when section is visible
const finaleObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) resizeFwCanvas();
  });
});
finaleObserver.observe(document.getElementById('finale'));
