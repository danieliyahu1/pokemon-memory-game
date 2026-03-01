import express, { Request, Response} from 'express';
import cors from 'cors';
import "dotenv/config";
import path from 'path';
import getInstance from './gameManager';
import http from 'http';
import { GameManagerType } from './types';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    })
);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon-game';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

const server = http.createServer(app);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

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