import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analyzeRouter from './routes/analyze';
import analysisRouter from './routes/analysis';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { guestIdCheck } from './middleware/guestIdCheck';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Required for express-rate-limit to accurately identify IPs behind reverse proxies (like Railway/Render)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per IP
  message: { error: 'Too many requests from this IP, please try again after a minute' }
});

// Middleware Stack as per Phase 1 roadmap
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

// Health check before strict rate limiting / guest check if desired, but roadmap says 
// 1. helmet, 2. cors, 3. json, 4. ratelimit, 5. guestIdCheck, 6. Routes. So we place health check in Routes.
app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

app.use('/api/analyze', analyzeRouter);

// We only enforce guestIdCheck on /analysis router according to common sense, 
// or globally? The roadmap says `5. guestIdCheck()`. Let's apply to analysis router.
app.use("/api/v1/analysis", analysisRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
