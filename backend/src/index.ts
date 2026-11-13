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
import {
    httpRequestDuration,
    httpRequests,
    mongoConnected,
    routeLabel,
    startMetricsServer,
} from './metrics';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bounded-label request metrics. `finish` fires for every response, including
// ones the static handler and the SPA catch-all produce.
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const route = routeLabel(req.path);
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        httpRequests.inc({ method: req.method, route, status: String(res.statusCode) });
        httpRequestDuration.observe({ method: req.method, route }, durationSeconds);
    });
    next();
});

// Kubernetes probes answer before the SPA catch-all can claim the path.
app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
});
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    })
);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pokemon-game';

// Mongo may still be running initdb on a fresh deploy, and mongoose does not retry
// after an initial failure - which used to leave a healthy pod answering every auth
// request with a 10s buffering timeout until someone restarted it by hand.
async function connectToMongo(): Promise<void> {
    const retryDelayMs = 3000;
    for (;;) {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('Connected to MongoDB');
            return;
        } catch (error) {
            console.error(
                `MongoDB connection failed (${(error as Error).message}); retrying in ${retryDelayMs / 1000}s`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
    }
}

void connectToMongo();
mongoConnected.set(0);
mongoose.connection.on('connected', () => mongoConnected.set(1));
mongoose.connection.on('disconnected', () => mongoConnected.set(0));

const server = http.createServer(app);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Serve only the built frontend. `express.static(path.resolve(""))` used to sit
// here and exposed the process working directory, including backend sources.
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

const game: GameManagerType = getInstance(server);
game.start();

// Metrics live on their own port so the public Service never exposes them.
startMetricsServer(Number(process.env.METRICS_PORT || 9464));

// const PORT = process.env.PORT || 7001;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });