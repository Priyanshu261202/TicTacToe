document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.board');
    const cells = [];
    const gameStatus = document.querySelector('.game-status');
    const resetBtn = document.querySelector('.reset-btn');
    const undoBtn = document.querySelector('.undo-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const difficultySelector = document.querySelector('.difficulty-selector');
    const playerXScore = document.querySelector('.player-x span');
    const playerOScore = document.querySelector('.player-o span');

    let currentPlayer = 'X';
    let gameMode = '2p'; // 2p or ai
    let difficulty = 'easy'; // easy, medium, hard
    let gameActive = true;
    let boardState = Array(9).fill(null);
    let moveHistory = [];

    // Initialize the board
    function initializeBoard() {
        board.innerHTML = '';
        cells.length = 0;
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
            cells.push(cell);
        }
    }

    // Handle cell click
    function handleCellClick(event) {
        if (!gameActive) return;

        const cell = event.target;
        const index = cell.dataset.index;

        if (boardState[index] !== null) return;

        boardState[index] = currentPlayer;
        moveHistory.push([...boardState]);
        cell.classList.add(currentPlayer.toLowerCase());
        checkGameStatus();

        if (gameMode === 'ai' && gameActive) {
            currentPlayer = 'O';
            setTimeout(makeAIMove, 500);
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        }
    }

    // Check game status (win/draw)
    function checkGameStatus() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
                gameActive = false;
                highlightWinningCells(combination);
                updateScore(boardState[a]);
                gameStatus.textContent = `Player ${boardState[a]} wins!`;
                return;
            }
        }

        if (!boardState.includes(null)) {
            gameActive = false;
            gameStatus.textContent = "It's a draw!";
        }
    }

    // Highlight winning cells
    function highlightWinningCells(cellsToHighlight) {
        cellsToHighlight.forEach(index => {
            cells[index].classList.add('win');
        });
    }

    // Update score
    function updateScore(winner) {
        if (winner === 'X') {
            playerXScore.textContent = parseInt(playerXScore.textContent) + 1;
        } else if (winner === 'O') {
            playerOScore.textContent = parseInt(playerOScore.textContent) + 1;
        }
    }

    // Reset the game
    function resetGame() {
        boardState = Array(9).fill(null);
        moveHistory = [];
        gameActive = true;
        currentPlayer = 'X';
        gameStatus.textContent = '';
        initializeBoard();
        undoBtn.disabled = true;
    }

    // Undo the last move
    function undoMove() {
        if (moveHistory.length > 1) {
            moveHistory.pop();
            boardState = [...moveHistory[moveHistory.length - 1]];
            renderBoard();
            gameActive = true;
            currentPlayer = moveHistory.length % 2 === 0 ? 'O' : 'X';
            undoBtn.disabled = moveHistory.length <= 1;
        }
    }

    // Render the board based on boardState
    function renderBoard() {
        cells.forEach((cell, index) => {
            cell.className = 'cell';
            if (boardState[index] === 'X') {
                cell.classList.add('x');
            } else if (boardState[index] === 'O') {
                cell.classList.add('o');
            }
        });
    }

    // AI move logic
    function makeAIMove() {
        let move;
        if (difficulty === 'easy') {
            move = getRandomMove();
        } else if (difficulty === 'medium') {
            move = getMediumMove();
        } else if (difficulty === 'hard') {
            move = getBestMove();
        }

        if (move !== null) {
            boardState[move] = 'O';
            moveHistory.push([...boardState]);
            cells[move].classList.add('o');
            checkGameStatus();
            currentPlayer = 'X';
        }
    }

    // Get a random move
    function getRandomMove() {
        const availableMoves = boardState.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        return availableMoves.length > 0 ? availableMoves[Math.floor(Math.random() * availableMoves.length)] : null;
    }

    // Get a medium difficulty move (random but tries to win or block)
    function getMediumMove() {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        // Check if AI can win in the next move
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (boardState[a] === 'O' && boardState[b] === 'O' && boardState[c] === null) return c;
            if (boardState[a] === 'O' && boardState[c] === 'O' && boardState[b] === null) return b;
            if (boardState[b] === 'O' && boardState[c] === 'O' && boardState[a] === null) return a;
        }

        // Check if player can win in the next move and block
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (boardState[a] === 'X' && boardState[b] === 'X' && boardState[c] === null) return c;
            if (boardState[a] === 'X' && boardState[c] === 'X' && boardState[b] === null) return b;
            if (boardState[b] === 'X' && boardState[c] === 'X' && boardState[a] === null) return a;
        }

        // Otherwise, make a random move
        return getRandomMove();
    }

    // Get the best move using Minimax algorithm
    function getBestMove() {
        let bestScore = -Infinity;
        let move;

        for (let i = 0; i < 9; i++) {
            if (boardState[i] === null) {
                boardState[i] = 'O';
                let score = minimax(boardState, 0, false);
                boardState[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }

        return move;
    }

    // Minimax algorithm
    function minimax(board, depth, isMaximizing) {
        const scores = {
            X: -1,
            O: 1,
            draw: 0
        };

        const result = checkWinner(board);
        if (result !== null) {
            return scores[result];
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    let score = minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    let score = minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    // Check for a winner
    function checkWinner(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        if (!board.includes(null)) {
            return 'draw';
        }

        return null;
    }

    // Event listeners
    resetBtn.addEventListener('click', resetGame);
    undoBtn.addEventListener('click', undoMove);

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            gameMode = button.dataset.mode;
            difficultySelector.style.display = gameMode === 'ai' ? 'flex' : 'none';
            resetGame();
        });
    });

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            difficultyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            difficulty = button.dataset.level;
        });
    });

    // Initialize the game
    initializeBoard();
});