import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import notFoundError from './app/error/notFoundError';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './app/routes/routes';
import stripeWebhook from './app/modules/payment/stripeWebhook';
const app = express();

// Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application routes (Centralized router)
app.use('/api/v1', router);

// Root router
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to the server' });
});

// Not found route
app.use(notFoundError);

// Global error handler
app.use(globalErrorHandler);

export default app;
