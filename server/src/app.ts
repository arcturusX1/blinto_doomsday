import express from 'express';
import cors from 'cors';
import movieRoutes from './routes/movieRoutes.ts';
import { notFound, errorHandler } from './middleware/errorHandler.ts';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/movies', movieRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
