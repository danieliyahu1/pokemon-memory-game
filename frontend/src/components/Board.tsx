import { CardType } from "../../../backend/src/sharedTypes";
import Card from "./Card";

type BoardProps = {
    i_ButtonOnClick?: ((id:number) => void);
    i_Cards: CardType[];
};

const Board = ({ i_ButtonOnClick, i_Cards} : BoardProps ) => {
    const nummColumns: number = Math.ceil(Math.sqrt(i_Cards.length));
    const columnSize: number = 30 * nummColumns;
    return (
        <div
        className={`h-${columnSize.toString()} w-${columnSize.toString()} flex-shrink-0 p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border-2 border-gray-600 grid shadow-2xl`}
        style={{
            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(i_Cards.length))}, minmax(0, 1fr))`,
            gridAutoRows: "minmax(100px, auto)",
            gap: "1rem",
        }}
        >            {i_Cards.map(card => (
                <Card onClick={card.covered ? i_ButtonOnClick : undefined} key={card.id} src={card.covered ? card.coverImage : card.uncoverImage} id={card.id} />
            ))}
        </div>
    )
}

export default Board