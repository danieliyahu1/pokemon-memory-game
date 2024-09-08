import Player from "./player";
import { CardType } from "./sharedTypes";
import { AIPlayerType } from "./types";

class AIPlayer extends Player implements AIPlayerType {

  private m_CardsRemember: CardType[];
  private m_CardChosen: CardType | undefined;

  constructor(i_Name: string, i_Id: string) {
    super(i_Name, i_Id);
    this.m_CardsRemember = [];
    this.m_CardChosen = undefined;
  }

  // Implement the move method
  public move(i_Cards: CardType[]): number {
    const cardId = this.checkMatch(this.m_CardChosen);
    let cardIndex: number = -1;
    
    for(let i = 0; i < i_Cards.length; i++)
    {
      if(cardId === i_Cards[i].id)
      {
        cardIndex = i;
        break;
      }
    }

    if(cardIndex === -1)
    {
      cardIndex = Math.floor(Math.random() * i_Cards.length);
    }
  
    
    while(!i_Cards[cardIndex].covered)
    {
      cardIndex = Math.floor(Math.random() * i_Cards.length);
    }    
    return cardIndex;
    // Add logic here for the computer player's move
  }

  public cardToRemember(i_Card: CardType)
  {
    this.m_CardsRemember.push(i_Card);
    if(this.m_CardsRemember.length > 8)
    {
      this.m_CardsRemember.shift();
    }
    this.sawCard(i_Card);
  }

  private sawCard(i_Card: CardType)
  {
    this.m_CardsRemember.filter((card)=> i_Card.id === card.id);
  }

  private checkMatch(card: CardType | undefined)
  {
    if(card === undefined)
    {
      return this.checkMatchSaw();
    }
    else
    {
      return this.checkMatchWIthCard(card);
    }
  }
  private checkMatchWIthCard(card: CardType): number
  {
    for (let i = 0; i < this.m_CardsRemember.length; i++) {
      if (this.m_CardsRemember[i].uncoverImage === card.uncoverImage) {
        return this.m_CardsRemember[i].id;
      }      
    }
    return -1;
  }
  private checkMatchSaw(): number
  {
    for (let i = 0; i < this.m_CardsRemember.length-1; i++) {
      for (let j = i + 1; j < this.m_CardsRemember.length; j++) {
        if (this.m_CardsRemember[i].uncoverImage === this.m_CardsRemember[j].uncoverImage) {
          return this.m_CardsRemember[i].id;
        }
      }
    }
    return -1;
  }
}

export default AIPlayer;
