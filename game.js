// Game state
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let targetWord = getTodayWord();
let guesses = [];
let keyboardState = {};

// DOM elements
const board = document.getElementById('board');
const keyboard = document.getElementById('keyboard');
const message = document.getElementById('message');
const infoBtn = document.getElementById('infoBtn');
const statsBtn = document.getElementById('statsBtn');
const infoModal = document.getElementById('infoModal');
const statsModal = document.getElementById('statsModal');
const shareBtn = document.getElementById('shareBtn');

// Initialize game
function init() {
    createBoard();
    createKeyboard();
    setupModals();
    loadGameState();
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);
}

// Create game board
function createBoard() {
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.id = `row-${i}`;
        
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
        }
        
        board.appendChild(row);
    }
}

// Create keyboard
function createKeyboard() {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['INVIO', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '←']
    ];
    
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyBtn = document.createElement('button');
            keyBtn.className = 'key';
            keyBtn.textContent = key;
            keyBtn.dataset.key = key;
            
            if (key === 'INVIO' || key === '←') {
                keyBtn.classList.add('wide');
            }
            
            keyBtn.addEventListener('click', () => handleKeyClick(key));
            rowDiv.appendChild(keyBtn);
        });
        
        keyboard.appendChild(rowDiv);
    });
}

// Handle key press
function handleKeyPress(e) {
    if (gameOver) return;
    
    const key = e.key.toUpperCase();
    
    if (key === 'ENTER') {
        handleKeyClick('INVIO');
    } else if (key === 'BACKSPACE') {
        handleKeyClick('←');
    } else if (key.length === 1 && key.match(/[A-Z]/)) {
        handleKeyClick(key);
    }
}

// Handle key click
function handleKeyClick(key) {
    if (gameOver) return;
    
    if (key === '←') {
        deleteLetter();
    } else if (key === 'INVIO') {
        submitGuess();
    } else {
        addLetter(key);
    }
}

// Add letter
function addLetter(letter) {
    if (currentTile < 5) {
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = letter;
        tile.classList.add('filled');
        currentTile++;
    }
}

// Delete letter
function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

// Submit guess
function submitGuess() {
    if (currentTile !== 5) {
        showMessage('Non abbastanza lettere');
        shakeRow(currentRow);
        return;
    }
    
    const guess = getCurrentGuess();
    
    if (!isValidWord(guess)) {
        showMessage('Parola non valida');
        shakeRow(currentRow);
        return;
    }
    
    guesses.push(guess);
    flipTiles(currentRow, guess);
    updateKeyboard(guess);
    
    if (guess === targetWord) {
        gameOver = true;
        setTimeout(() => {
            showMessage('Fantastico! 🎉', 'win');
            updateStats(true, currentRow + 1);
            saveGameState();
            showStats();
        }, 2000);
    } else if (currentRow === 5) {
        gameOver = true;
        setTimeout(() => {
            showMessage(`La parola era: ${targetWord}`, 'lose');
            updateStats(false, 0);
            saveGameState();
            showStats();
        }, 2000);
    } else {
        currentRow++;
        currentTile = 0;
        saveGameState();
    }
}

// Get current guess
function getCurrentGuess() {
    let guess = '';
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        guess += tile.textContent;
    }
    return guess;
}

// Flip tiles with animation
function flipTiles(row, guess) {
    const tiles = [];
    for (let i = 0; i < 5; i++) {
        tiles.push(document.getElementById(`tile-${row}-${i}`));
    }
    
    const letterCount = {};
    for (let char of targetWord) {
        letterCount[char] = (letterCount[char] || 0) + 1;
    }
    
    const status = Array(5).fill('absent');
    
    // First pass: mark correct letters
    for (let i = 0; i < 5; i++) {
        if (guess[i] === targetWord[i]) {
            status[i] = 'correct';
            letterCount[guess[i]]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < 5; i++) {
        if (status[i] !== 'correct' && letterCount[guess[i]] > 0) {
            status[i] = 'present';
            letterCount[guess[i]]--;
        }
    }
    
    // Apply status with delay
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add(status[index]);
        }, index * 300);
    });
}

// Update keyboard colors
function updateKeyboard(guess) {
    const letterCount = {};
    for (let char of targetWord) {
        letterCount[char] = (letterCount[char] || 0) + 1;
    }
    
    for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        
        if (guess[i] === targetWord[i]) {
            keyboardState[letter] = 'correct';
        } else if (targetWord.includes(letter) && keyboardState[letter] !== 'correct') {
            keyboardState[letter] = 'present';
        } else if (!targetWord.includes(letter)) {
            keyboardState[letter] = 'absent';
        }
    }
    
    // Update keyboard UI
    Object.keys(keyboardState).forEach(letter => {
        const key = document.querySelector(`[data-key="${letter}"]`);
        if (key) {
            key.classList.remove('correct', 'present', 'absent');
            key.classList.add(keyboardState[letter]);
        }
    });
}

// Shake row animation
function shakeRow(row) {
    const rowElement = document.getElementById(`row-${row}`);
    rowElement.style.animation = 'shake 0.5s';
    setTimeout(() => {
        rowElement.style.animation = '';
    }, 500);
}

// Show message
function showMessage(text, type = '') {
    message.textContent = text;
    message.className = 'message show';
    if (type) message.classList.add(type);
    
    setTimeout(() => {
        message.classList.remove('show');
    }, 2000);
}

// Setup modals
function setupModals() {
    const modals = [infoModal, statsModal];
    const closeBtns = document.querySelectorAll('.close');
    
    infoBtn.onclick = () => infoModal.style.display = 'block';
    statsBtn.onclick = () => showStats();
    
    closeBtns.forEach(btn => {
        btn.onclick = function() {
            this.closest('.modal').style.display = 'none';
        };
    });
    
    window.onclick = (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    shareBtn.onclick = shareResults;
}

// Stats functions
function getStats() {
    const stats = localStorage.getItem('parola-stats');
    return stats ? JSON.parse(stats) : {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: [0, 0, 0, 0, 0, 0]
    };
}

function updateStats(won, attempts) {
    const stats = getStats();
    stats.played++;
    
    if (won) {
        stats.won++;
        stats.currentStreak++;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.distribution[attempts - 1]++;
    } else {
        stats.currentStreak = 0;
    }
    
    localStorage.setItem('parola-stats', JSON.stringify(stats));
}

function showStats() {
    const stats = getStats();
    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
    
    document.getElementById('gamesPlayed').textContent = stats.played;
    document.getElementById('winRate').textContent = winRate;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('maxStreak').textContent = stats.maxStreak;
    
    if (gameOver) {
        document.getElementById('shareSection').style.display = 'block';
    }
    
    statsModal.style.display = 'block';
}

// Share results
function shareResults() {
    const stats = getStats();
    const attempts = guesses.length;
    const won = guesses[guesses.length - 1] === targetWord;
    
    let text = `PAROLA ${attempts}/6\n\n`;
    
    guesses.forEach(guess => {
        for (let i = 0; i < 5; i++) {
            if (guess[i] === targetWord[i]) {
                text += '🟩';
            } else if (targetWord.includes(guess[i])) {
                text += '🟨';
            } else {
                text += '⬜';
            }
        }
        text += '\n';
    });
    
    text += '\nhttps://eponalab.github.io/parola/';
    
    navigator.clipboard.writeText(text).then(() => {
        const shareMessage = document.getElementById('shareMessage');
        shareMessage.style.display = 'block';
        setTimeout(() => {
            shareMessage.style.display = 'none';
        }, 2000);
    });
}

// Save/load game state
function saveGameState() {
    const state = {
        currentRow,
        currentTile,
        gameOver,
        targetWord,
        guesses,
        keyboardState,
        date: new Date().toDateString()
    };
    localStorage.setItem('parola-state', JSON.stringify(state));
}

function loadGameState() {
    const saved = localStorage.getItem('parola-state');
    if (!saved) return;
    
    const state = JSON.parse(saved);
    const today = new Date().toDateString();
    
    // Reset if new day
    if (state.date !== today) {
        localStorage.removeItem('parola-state');
        return;
    }
    
    // Restore state
    currentRow = state.currentRow;
    currentTile = state.currentTile;
    gameOver = state.gameOver;
    targetWord = state.targetWord;
    guesses = state.guesses;
    keyboardState = state.keyboardState;
    
    // Restore board
    guesses.forEach((guess, row) => {
        for (let i = 0; i < 5; i++) {
            const tile = document.getElementById(`tile-${row}-${i}`);
            tile.textContent = guess[i];
            
            if (guess[i] === targetWord[i]) {
                tile.classList.add('correct');
            } else if (targetWord.includes(guess[i])) {
                tile.classList.add('present');
            } else {
                tile.classList.add('absent');
            }
        }
    });
    
    // Restore current row
    for (let i = 0; i < currentTile; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        tile.classList.add('filled');
    }
    
    // Restore keyboard
    Object.keys(keyboardState).forEach(letter => {
        const key = document.querySelector(`[data-key="${letter}"]`);
        if (key) {
            key.classList.add(keyboardState[letter]);
        }
    });
    
    // Show result if game over
    if (gameOver) {
        const won = guesses[guesses.length - 1] === targetWord;
        setTimeout(() => {
            if (won) {
                showMessage('Fantastico! 🎉', 'win');
            } else {
                showMessage(`La parola era: ${targetWord}`, 'lose');
            }
        }, 500);
    }
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
        20%, 40%, 60%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Show info modal on first visit
if (!localStorage.getItem('parola-visited')) {
    setTimeout(() => {
        infoModal.style.display = 'block';
        localStorage.setItem('parola-visited', 'true');
    }, 500);
}
