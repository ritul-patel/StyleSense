"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const analysis_1 = __importDefault(require("./routes/analysis"));
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Required for express-rate-limit to accurately identify IPs behind reverse proxies (like Railway/Render)
app.set('trust proxy', 1);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 requests per IP
    message: { error: 'Too many requests from this IP, please try again after a minute' }
});
// Middleware Stack as per Phase 1 roadmap
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(logger_1.logger);
// Health check before strict rate limiting / guest check if desired, but roadmap says 
// 1. helmet, 2. cors, 3. json, 4. ratelimit, 5. guestIdCheck, 6. Routes. So we place health check in Routes.
app.use(limiter);
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});
app.use('/api/analyze', analyze_1.default);
// We only enforce guestIdCheck on /analysis router according to common sense, 
// or globally? The roadmap says `5. guestIdCheck()`. Let's apply to analysis router.
app.use("/api/v1/analysis", analysis_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
