function findBestMove(mark) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    const line = [boardState[a], boardState[b], boardState[c]];
    if (line.filter(v=>v===mark).length===2 && line.includes(null)) {
      const idx = [a,b,c][line.indexOf(null)];
      return idx;
    }
  }
  return null;
}

const BOARD_SIZE = 3;
const BOX_SIZE = 48;
const GAP = 11;
const TOTAL_BOARD_SIZE = BOX_SIZE * BOARD_SIZE + GAP * (BOARD_SIZE - 1);
const FOREHEAD_Y_RATIO = 0.26; // 이마 위치 비율

let boardState = Array(9).fill(null); // 0~8, null|"O"|"X"
let isPlayerTurn = true;
let gameActive = true;

const CDN = "https://cdn.jsdelivr.net/gh/aoaochan/speaki-tic-tac-toe@main/assets/";
const LEVELS = [
  { img: CDN + "g1.webp", ai: aiEasy },
  { img: CDN + "g2.webp", ai: aiNormal },
  { img: CDN + "g3.webp", ai: aiHard }
];
let level = 0; // 0:쉬움, 1:보통, 2:어려움

function getBoxes() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => document.getElementById(`box-${i}`));
}

function getBoardRect() {
  const board = document.getElementById("board");
  return board.getBoundingClientRect();
}

function getForeheadCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height * FOREHEAD_Y_RATIO,
  };
}

function updateBoxPositions() {
  const rect = getBoardRect();
  const { x: centerX, y: centerY } = getForeheadCenter(rect);
  const boardLeft = centerX - TOTAL_BOARD_SIZE / 2;
  const boardTop = centerY - TOTAL_BOARD_SIZE / 2;
  const boxes = getBoxes();

  boxes.forEach((box, i) => {
    const row = Math.floor(i / BOARD_SIZE);
    const col = i % BOARD_SIZE;
    const x = boardLeft + col * (BOX_SIZE + GAP);
    const y = boardTop + row * (BOX_SIZE + GAP);
    box.style.position = "absolute";
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;
  });
}

function renderBoard() {
  const boxes = getBoxes();
  boxes.forEach((box, i) => {
    box.textContent = boardState[i] ? boardState[i] : "";
    box.style.color = boardState[i] === "O" ? "#1976d2" : boardState[i] === "X" ? "#d32f2f" : "";
    box.style.fontSize = "2.2rem";
    box.style.fontWeight = "bold";
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "center";
    box.style.cursor = gameActive && !boardState[i] && isPlayerTurn ? "pointer" : "default";
  });
}

function checkWinner(state) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6]          // diags
  ];
  for (const [a,b,c] of lines) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return state[a];
  }
  if (state.every(v => v)) return "draw";
  return null;
}

function playerMove(idx) {
  if (!gameActive || !isPlayerTurn || boardState[idx]) return;
  boardState[idx] = "O";
  isPlayerTurn = false;
  renderBoard();
  const result = checkWinner(boardState);
  if (result) return endGame(result);
  setTimeout(computerMove, 400);
}

function setOpponentImg() {
  const img = document.getElementById("opponent-img");
  img.src = LEVELS[level].img;
}

function aiEasy() {
  // 무작위
  const empty = boardState.map((v,i) => v?null:i).filter(v=>v!==null);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random()*empty.length)];
}
function aiNormal() {
  // 막기만
  let move = findBestMove("O");
  if (move !== null) return move;
  return aiEasy();
}
function aiHard() {
  // 공격/방어
  let move = findBestMove("X");
  if (move !== null) return move;
  move = findBestMove("O");
  if (move !== null) return move;
  return aiEasy();
}

function computerMove() {
  if (!gameActive) return;
  const ai = LEVELS[level].ai;
  const move = ai();
  if (move === null) return;
  boardState[move] = "X";
  renderBoard();
  const result = checkWinner(boardState);
  if (result) return endGame(result);
  isPlayerTurn = true;
}

function showOverlay(result) {
  const overlay = document.getElementById("overlay");
  const msg = document.getElementById("overlay-message");
  const retryBtn = document.getElementById("retry-btn");
  overlay.classList.add("show");
  retryBtn.style.display = "none";
  if (result === "O") {
    msg.textContent = level === 2 ? "최고 난이도 클리어!" : "승리!";
    msg.style.color = "#1976d2";
    setTimeout(() => {
      retryBtn.textContent = (level < 2) ? "다음 상대" : "다시하기";
      retryBtn.style.display = "block";
    }, 2000);
  } else if (result === "X") {
    msg.textContent = "패배!";
    msg.style.color = "#d32f2f";
    setTimeout(() => {
      retryBtn.textContent = "다시하기";
      retryBtn.style.display = "block";
    }, 2000);
  } else {
    msg.textContent = "무승부";
    msg.style.color = "#fff";
    setTimeout(() => {
      retryBtn.textContent = "다시하기";
      retryBtn.style.display = "block";
    }, 2000);
  }
}

function hideOverlay() {
  const overlay = document.getElementById("overlay");
  overlay.classList.remove("show");
}

function playBgm() {
  const bgm = document.getElementById("bgm");
  if (bgm.paused) {
    bgm.volume = 0.5;
    bgm.play().catch(()=>{});
  }
}

function playEffect(result) {
  // result: "O"(승리), "X"(패배), "draw"
  if (result === "O") {
    if (level === 1) document.getElementById("g2win").play();
    else if (level === 2) document.getElementById("g3win").play();
  } else if (result === "X" || result === "draw") {
    if (level === 0 && result === "X") document.getElementById("g1lose").play();
    else document.getElementById("g2g3lose").play();
  }
}

function endGame(result) {
  gameActive = false;
  renderBoard();
  playEffect(result);
  showOverlay(result);
}

function stopAllEffects() {
  ["g1lose","g1win","g2win","g3win","g2g3lose"].forEach(id => {
    const audio = document.getElementById(id);
    audio.pause();
    audio.currentTime = 0;
  });
}

function resetGame(nextLevel = false) {
  stopAllEffects();
  if (nextLevel && level < 2) level++;
  else if (!nextLevel && level > 0 && document.getElementById("retry-btn").textContent === "다음 상대") level = 0;
  boardState = Array(9).fill(null);
  isPlayerTurn = true;
  gameActive = true;
  renderBoard();
  hideOverlay();
  setOpponentImg();
}

function attachBoxEvents() {
  getBoxes().forEach((box, i) => {
    box.onclick = () => playerMove(i);
  });
}

function attachRetryEvent() {
  const retryBtn = document.getElementById("retry-btn");
  retryBtn.onclick = () => {
    if (retryBtn.textContent === "다음 상대") resetGame(true);
    else resetGame(false);
  };
}

function onDOMContentLoaded() {
  const board = document.getElementById("board");
  if (board.complete) {
    updateBoxPositions();
    renderBoard();
    attachBoxEvents();
    attachRetryEvent();
    setOpponentImg();
    playBgm();
  } else {
    board.addEventListener("load", () => {
      updateBoxPositions();
      renderBoard();
      attachBoxEvents();
      attachRetryEvent();
      setOpponentImg();
      playBgm();
    });
  }
}

window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
window.addEventListener("resize", updateBoxPositions);

// body 클릭/터치 시 playBgm 시도
window.addEventListener("click", playBgm, { once: true });
window.addEventListener("touchstart", playBgm, { once: true });