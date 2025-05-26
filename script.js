// Game state
const gameState = {
    board: Array(9).fill(''),
    currentPlayer: 'X',
    gameMode: null,
    gameActive: false,
    scores: {
        X: 0,
        O: 0,
        draw: 0
    },
    aiDifficulty: 0.7 // 0.7 means 70% chance of making the best move
};

// DOM Elements
const modeSelection = document.getElementById('mode-selection');
const gameBoard = document.getElementById('game-board');
const scoreboard = document.getElementById('scoreboard');
const cells = document.querySelectorAll('[data-cell]');
const status = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const singlePlayerBtn = document.getElementById('single-player');
const twoPlayersBtn = document.getElementById('two-players');

// Audio elements
const clickSound = document.getElementById('click-sound');
const winSound = document.getElementById('win-sound');
const drawSound = document.getElementById('draw-sound');

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

// Initialize game
function initGame() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick, { once: true });
        cell.classList.remove('x', 'o', 'winning');
    });
    gameState.board = Array(9).fill('');
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    updateStatus();
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = Array.from(cells).indexOf(cell);

    if (gameState.board[index] !== '' || !gameState.gameActive) return;

    // Play click sound
    clickSound.currentTime = 0;
    clickSound.play();

    // Make move
    makeMove(cell, index);

    // Check for game end
    if (checkWin()) {
        endGame(false);
        return;
    }

    if (checkDraw()) {
        endGame(true);
        return;
    }

    // Switch player
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    // AI move in single player mode
    if (gameState.gameMode === 'single' && gameState.currentPlayer === 'O' && gameState.gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

// Make a move
function makeMove(cell, index) {
    gameState.board[index] = gameState.currentPlayer;
    cell.classList.add(gameState.currentPlayer.toLowerCase());
    cell.textContent = gameState.currentPlayer;
}

// AI move
function makeAIMove() {
    // Random chance to make a random move instead of the best move
    if (Math.random() > gameState.aiDifficulty) {
        makeRandomMove();
    } else {
        const bestMove = findBestMove();
        const cell = cells[bestMove];
        handleCellClick({ target: cell });
    }
}

// Make a random move
function makeRandomMove() {
    const emptyCells = gameState.board
        .map((cell, index) => cell === '' ? index : null)
        .filter(cell => cell !== null);

    if (emptyCells.length > 0) {
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const cell = cells[randomIndex];
        handleCellClick({ target: cell });
    }
}

// Find the best move using minimax algorithm
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;
    let availableMoves = [];
    
    // Try each empty cell
    for (let i = 0; i < 9; i++) {
        if (gameState.board[i] === '') {
            gameState.board[i] = 'O';
            const score = minimax(gameState.board, 0, false);
            gameState.board[i] = '';
            
            // Store all moves with their scores
            availableMoves.push({ index: i, score: score });
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    
    // Filter moves that are close to the best score
    const goodMoves = availableMoves.filter(move => 
        move.score >= bestScore - 2 && move.score <= bestScore + 2
    );
    
    // Randomly choose from good moves
    if (goodMoves.length > 0) {
        const randomGoodMove = goodMoves[Math.floor(Math.random() * goodMoves.length)];
        return randomGoodMove.index;
    }
    
    return bestMove;
}

// Minimax algorithm
function minimax(board, depth, isMaximizing) {
    // Check for terminal states
    if (checkWinner(board) === 'O') return 10 - depth;
    if (checkWinner(board) === 'X') return depth - 10;
    if (isBoardFull(board)) return 0;
    
    // Limit the depth of the search to make it less perfect
    if (depth >= 4) return 0;
    
    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Check if board is full
function isBoardFull(board) {
    return board.every(cell => cell !== '');
}

// Check for winner (modified version of checkWin for a given board state)
function checkWinner(board) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }
    return null;
}

// Check for win
function checkWin() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        if (
            gameState.board[a] &&
            gameState.board[a] === gameState.board[b] &&
            gameState.board[a] === gameState.board[c]
        ) {
            // Highlight winning cells
            cells[a].classList.add('winning');
            cells[b].classList.add('winning');
            cells[c].classList.add('winning');
            return true;
        }
        return false;
    });
}

// Check for draw
function checkDraw() {
    return gameState.board.every(cell => cell !== '');
}

// End game
function endGame(isDraw) {
    gameState.gameActive = false;
    
    if (isDraw) {
        status.textContent = "Game ended in a draw!";
        gameState.scores.draw++;
        drawSound.play();
    } else {
        status.textContent = `Player ${gameState.currentPlayer} wins!`;
        gameState.scores[gameState.currentPlayer]++;
        winSound.play();
    }
    
    updateScoreboard();
}

// Update status
function updateStatus() {
    status.textContent = `Player ${gameState.currentPlayer}'s turn`;
}

// Update scoreboard
function updateScoreboard() {
    document.getElementById('score-x').textContent = gameState.scores.X;
    document.getElementById('score-o').textContent = gameState.scores.O;
    document.getElementById('score-draw').textContent = gameState.scores.draw;
}

// Restart game
function restartGame() {
    cells.forEach(cell => {
        cell.classList.remove('x', 'o', 'winning');
        cell.removeEventListener('click', handleCellClick);
        cell.textContent = '';
    });
    initGame();
}

// Set game mode
function setGameMode(mode) {
    gameState.gameMode = mode;
    modeSelection.classList.add('hidden');
    gameBoard.classList.remove('hidden');
    scoreboard.classList.remove('hidden');
    initGame();
}

// Event Listeners
singlePlayerBtn.addEventListener('click', () => setGameMode('single'));
twoPlayersBtn.addEventListener('click', () => setGameMode('two'));
restartBtn.addEventListener('click', restartGame); 