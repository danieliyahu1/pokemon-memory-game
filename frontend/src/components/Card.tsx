type CardProps = {
    src: string;
    id: number;
    onClick?: ((id:number) => void);
}


const Card = (props : CardProps)  => {
    return(
        <div onClick= {() => props.onClick?.(props.id)}
            className="bg-gray-800 aspect-w-1 aspect-h-1 w-24 h-24 relative overflow-hidden cursor-pointer border border-gray-200 rounded-lg shadow-lg"
        >
            <img className="absolute inset-0 aspect-w-1 aspect-h-1 object-contain"  src={props.src} alt="card front"/>
        </div>
    )
}

export default Card;