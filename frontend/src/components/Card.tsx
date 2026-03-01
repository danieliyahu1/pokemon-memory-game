type CardProps = {
    src: string;
    id: number;
    onClick?: ((id:number) => void);
}


const Card = (props : CardProps)  => {
    return(
        <div onClick= {() => props.onClick?.(props.id)}
            className="bg-gradient-to-br from-gray-700 to-gray-900 aspect-w-1 aspect-h-1 w-24 h-24 relative overflow-hidden cursor-pointer border-2 border-gray-400 rounded-lg shadow-lg transition-all duration-200 hover:shadow-2xl hover:border-blue-400 hover:scale-105 active:scale-95"
        >
            <style>{`
                @keyframes cardFlip {
                    0% { transform: rotateY(0deg); }
                    50% { transform: rotateY(90deg); }
                    100% { transform: rotateY(0deg); }
                }
                .card-revealed {
                    animation: cardFlip 0.3s ease-in-out;
                }
            `}</style>
            <img className="absolute inset-0 aspect-w-1 aspect-h-1 object-contain"  src={props.src} alt="card front"/>
        </div>
    )
}

export default Card;