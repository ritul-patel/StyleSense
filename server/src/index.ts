import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analysisRouter from './routes/analysis';
import wardrobeRouter from './routes/wardrobe';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = process.env.STYLESENSE_PORT || process.env.PORT || 4000;
// Required for express-rate-limit to accurately identify IPs behind reverse proxies (like Railway/Render)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per IP
  message: { error: 'Too many requests from this IP, please try again after a minute' }
});

app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "https://www.stylesens.in",
  "https://stylesens.in",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(logger);
app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

app.use("/api/v1/analysis", analysisRouter);
app.use("/api/v1/wardrobe", wardrobeRouter);

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('error', (error) => {
  console.error('[ServerError]', error);
  // Keep dev behavior explicit: if bind fails, terminate so caller can restart cleanly.
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error);
});
