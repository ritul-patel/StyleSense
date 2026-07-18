// Sentry must be imported first - before any other modules
import { Sentry, isSentryEnabled } from './utils/sentry';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analysisRouter from './routes/analysis';
import wardrobeRouter from './routes/wardrobe';
import profileRouter from './routes/profile';
import productsRouter from './routes/products';
import adminProductsRouter from './routes/adminProducts';
import adminOutfitsRouter from './routes/adminOutfits';
import adminImportRouter from './routes/adminImport';
import adminImagesRouter from './routes/adminImages';
import adminMetadataRouter from './routes/adminMetadata';
import adminRouter from './routes/admin';
import recommendationsRouter from './routes/recommendations';
import feedbackRouter from './routes/feedback';
import savedOutfitsRouter from './routes/savedOutfits';
import blogRouter from './routes/blog';
import adminBlogRouter from './routes/adminBlog';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = process.env.STYLESENSE_PORT || process.env.PORT || 4000;
// Required for express-rate-limit to accurately identify IPs behind reverse proxies (like Railway/Render)
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP per minute (general)
  message: { error: 'Too many requests from this IP, please try again after a minute' }
});

// Stricter limit for expensive AI/upload operations
const analysisLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 analysis requests per minute per IP
  message: { error: 'Too many analysis requests. Please wait a moment.' }
});

app.use(helmet());
const allowedOrigins = [
  "https://www.stylesense.co.in",
  "https://stylesense.co.in",
  "https://www.stylesens.in",
  "https://stylesens.in",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://localhost:3001"] : []),
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
app.use(express.json({ limit: "10mb" }));
app.use(logger);
app.use(limiter);

app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy');
});

app.use("/api/v1/analysis", analysisLimiter, analysisRouter);
app.use("/api/v1/wardrobe", wardrobeRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/admin/products", adminProductsRouter);
app.use("/api/v1/admin/outfits", adminOutfitsRouter);
app.use("/api/v1/admin/import", adminImportRouter);
app.use("/api/v1/admin/images", adminImagesRouter);
app.use("/api/v1/admin/metadata", adminMetadataRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/recommendations", recommendationsRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/saved-outfits", savedOutfitsRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/admin/blog", adminBlogRouter);

// Sentry error handler - must be before custom errorHandler
if (isSentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

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
  if (isSentryEnabled && reason instanceof Error) {
    Sentry.captureException(reason);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[UncaughtException]', error);
  if (isSentryEnabled) {
    Sentry.captureException(error);
  }
});
