import { PlayerType } from "./types";

class Player implements PlayerType{
    private m_Name: string;
    private m_CardsChosen: number[];
    private m_MovesCount: number;
    private m_CardsUncover: number[];
    private m_Id: string;
    private m_Turn: boolean;
    private m_Points: number;

    constructor(i_Name: string, i_Id: string) {
        this.m_Name = i_Name;
        this.m_CardsChosen = [];
        this.m_MovesCount = 0;
        this.m_CardsUncover = [];
        this.m_Id = i_Id;
        this.m_Turn = false;
        this.m_Points = 0;
    }

    public increaseMovesCount(i_NumToIncrease: number): void
    {
        this.m_MovesCount += i_NumToIncrease;
    }
    public increasePoints(i_NumToIncrease: number): void
    {
        this.m_Points += i_NumToIncrease;
    }

    get name(): string {
        return this.m_Name;
    }

    get cardsChosen(): number[] {
        return this.m_CardsChosen;
    }

    get MovesCount(): number {
        return this.m_MovesCount;
    }

    get points(): number {
        return this.m_Points;
    }

    get cardsUncover(): number[] {
        return this.m_CardsUncover;
    }

    get id(): string {
        return this.m_Id;
    }

    get turn(): boolean {
        return this.m_Turn;
    }

    set turn(i_Turn) {
        this.m_Turn = i_Turn;
    }
}

export default Player;