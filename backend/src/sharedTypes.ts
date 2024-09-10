export type CardType = {
    id: number;
    coverImage: string;
    uncoverImage: string;
    covered: boolean;
};

export type Result = {
    cards: CardType[],
    currentPlayerTurn: boolean,
    audioUrl: string,
}

export type MoveResult = Result & {
    disableBoard: boolean,
    cardsNotMatch: boolean,
    currentPlayerMovesCount: number,
}