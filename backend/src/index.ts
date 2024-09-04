import express, { Request, Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import path from 'path';
import getInstance from './gameManager';
import http from 'http';
import { GameManagerType } from './types';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    })
);

const server = http.createServer(app);

app.use(express.static(path.resolve("")));

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

const game: GameManagerType = getInstance(server);
game.start();

// const PORT = process.env.PORT || 7001;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });