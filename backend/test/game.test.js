const test = require('node:test');
const assert = require('node:assert/strict');

const Game = require('../dist/game').default;
const Player = require('../dist/player').default;

const audios = () => new Map([
    ['card_flipped', 'flip.mp3'],
    ['cards_match', 'match.mp3'],
    ['unmatch_cards', 'unmatch.mp3'],
    ['start_game', 'start.mp3'],
    ['player_won', 'won.mp3'],
    ['player_lost', 'lost.mp3'],
    ['draw', 'draw.mp3'],
]);

const cards = () => ([
    { id: 0, coverImage: 'cover.jpg', uncoverImage: 'bulbasaur.png', covered: true },
    { id: 1, coverImage: 'cover.jpg', uncoverImage: 'bulbasaur.png', covered: true },
    { id: 2, coverImage: 'cover.jpg', uncoverImage: 'charmander.png', covered: true },
    { id: 3, coverImage: 'cover.jpg', uncoverImage: 'charmander.png', covered: true },
]);

const newGame = (onGameOver = () => {}) => {
    const p1 = new Player('Ash', 'p1');
    const p2 = new Player('Gary', 'p2');
    const game = new Game(p1, p2, 'game-1', cards(), false, audios(), onGameOver);

    // Who starts is random by design. Pin it so move assertions stay stable.
    p1.turn = true;
    p2.turn = false;

    return game;
};

test('a matching pair scores a point and keeps the board enabled', () => {
    const game = newGame();
    const player = game.p1;

    const first = game.move(0);
    assert.equal(first.cardsNotMatch, false);
    assert.equal(first.currentPlayerPointsCount, 0);
    assert.equal(first.audioUrl, 'flip.mp3');

    const second = game.move(1);
    assert.equal(second.cardsNotMatch, false);
    assert.equal(second.disableBoard, false);
    assert.equal(second.currentPlayerPointsCount, 1);
    assert.equal(second.audioUrl, 'match.mp3');
    assert.equal(player.points, 1);
    assert.equal(player.MovesCount, 2);
});

test('a mismatched pair disables the board and hides the cards again', () => {
    const game = newGame();

    game.move(0);
    const mismatch = game.move(2);

    assert.equal(mismatch.cardsNotMatch, true);
    assert.equal(mismatch.disableBoard, true);
    assert.equal(mismatch.audioUrl, 'unmatch.mp3');

    game.hideCards();
    assert.ok(game.cards.every(card => card.covered), 'all cards are covered again');
    assert.equal(game.p1.turn, false, 'turn passes to the other player');
    assert.equal(game.p2.turn, true);
});

test('a card cannot be uncovered twice', () => {
    const game = newGame();

    game.move(0);
    assert.throws(() => game.move(0), /already been uncovered/);
});

test('clearing every pair ends the game and reports the winner', async () => {
    let result;
    const game = newGame((gameId, winner, points, moves) => {
        result = { gameId, winner, points, moves };
    });

    game.move(0);
    game.move(1);
    game.move(2);
    game.move(3);

    assert.equal(game.gameIsOver, true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    assert.equal(result.gameId, 'game-1');
    assert.equal(result.winner.name, 'Ash');
    assert.equal(result.gameId, 'game-1');
    assert.equal(result.points, 2);
});

test('initializeGameForUI sends the board and the start sound', () => {
    const game = newGame();
    const result = game.initializeGameForUI({ id: 'p1' });

    assert.equal(result.cards.length, 4);
    assert.equal(result.currentPlayerTurn, true);
    assert.equal(result.audioUrl, 'start.mp3');
});
