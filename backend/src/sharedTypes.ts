import { CardType } from "./types"

export type Result = {
    cards: CardType[],
    currentPlayerTurn: boolean,
}

export type MoveResult = Result & {
    disableBoard: boolean,
    cardsNotMatch: boolean,
    currentPlayerMovesCount: number,
}