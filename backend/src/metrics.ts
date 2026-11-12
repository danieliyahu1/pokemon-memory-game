import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from '@prometheus-io/client';
import http from 'http';

// A dedicated registry keeps the exported metrics explicit: nothing reaches the
// scrape endpoint that this file did not put there.
export const registry = new Registry();

collectDefaultMetrics({ register: registry });

export const httpRequests = new Counter({
    name: 'pokemon_http_requests_total',
    help: 'HTTP requests served by the Express server.',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [registry],
});

export const httpRequestDuration = new Histogram({
    name: 'pokemon_http_request_duration_seconds',
    help: 'Duration of HTTP requests served by the Express server.',
    labelNames: ['method', 'route'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
});

// Route labels must stay bounded: a raw URL carries usernames and query strings
// and would grow the label set without limit. Everything unknown falls into
// /api/other or /static.
const KNOWN_ROUTES = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/users/search',
    '/healthz',
];

export const routeLabel = (path: string): string => {
    if (KNOWN_ROUTES.includes(path)) {
        return path;
    }
    if (path.startsWith('/api/')) {
        return '/api/other';
    }
    return '/static';
};

export const connectedClients = new Gauge({
    name: 'pokemon_socket_clients',
    help: 'Socket.IO clients currently connected.',
    registers: [registry],
});

export const waitingPlayers = new Gauge({
    name: 'pokemon_waiting_players',
    help: 'Players waiting in the matchmaking list.',
    registers: [registry],
});

export const activeGames = new Gauge({
    name: 'pokemon_active_games',
    help: 'Games currently in progress.',
    registers: [registry],
});

export const gamesCreated = new Counter({
    name: 'pokemon_games_created_total',
    help: 'Games created since the process started.',
    labelNames: ['mode'] as const,
    registers: [registry],
});

export const gamesFinished = new Counter({
    name: 'pokemon_games_finished_total',
    help: 'Games that reached a result.',
    labelNames: ['result'] as const,
    registers: [registry],
});

export const moves = new Counter({
    name: 'pokemon_moves_total',
    help: 'Card moves by outcome: miss when the two flipped cards did not match, play otherwise.',
    labelNames: ['result'] as const,
    registers: [registry],
});

export const cloudinaryAssets = new Gauge({
    name: 'pokemon_cloudinary_assets',
    help: 'Assets loaded from Cloudinary at startup.',
    labelNames: ['kind'] as const,
    registers: [registry],
});

export const mongoConnected = new Gauge({
    name: 'pokemon_mongodb_connected',
    help: '1 when Mongoose reports an open connection, 0 otherwise.',
    registers: [registry],
});

// Gauges in this client do not create their series until first touched. Emit the
// zero baseline at startup so the dashboard shows "no clients" rather than "no data".
connectedClients.set(0);
waitingPlayers.set(0);
activeGames.set(0);
mongoConnected.set(0);
cloudinaryAssets.set({ kind: 'cards' }, 0);
cloudinaryAssets.set({ kind: 'covers' }, 0);
cloudinaryAssets.set({ kind: 'audio' }, 0);

export const startMetricsServer = (port: number): http.Server => {
    const server = http.createServer(async (req, res) => {
        if (req.url === '/metrics') {
            res.setHeader('Content-Type', registry.contentType);
            res.end(await registry.metrics());
            return;
        }
        if (req.url === '/healthz') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok' }));
            return;
        }
        res.statusCode = 404;
        res.end('not found');
    });

    server.listen(port, '0.0.0.0', () => {
        console.log(`Metrics server is running on port ${port}`);
    });

    return server;
};
