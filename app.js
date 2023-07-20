const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// security packages
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const userRoutes = require('./routes/userRoutes');
const transacRoutes = require('./routes/transacRoutes');
const categorieRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalsRoutes = require('./routes/goalRoutes');
// const { castObject } = require('./models/userModel');

const app = express();

// allow cross origin request : Postman doesn't send origin headers so you need to add them manually
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://127.0.0.1:8000/',
      'http://localhost:3000',
      'http://localhost:8000',
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// allow cross origin request
app.use(cors(corsOptions));

// use the same CORS options for preflight requests
app.options('*', cors(corsOptions));

//TODO security
// set security http headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// rate limit to prevent brute force attack
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message:
    'Trop de requêtes provenant de cette adresse IP, veuillez réessayer dans une heure !',
});
app.use('/api', limiter);

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// parse cookies
app.use(cookieParser());

// data sanitization against NoSQL query injection(look at the req.body , req.params, req.query and filter out $ and . )
app.use(mongoSanitize());

// data sanitization against XSS (clean any user input from malicious html code)
app.use(xss());

// prevent parameter pollution (remove duplicate query parameters)
app.use(
  hpp({
    whitelist: [
      'username',
      'email',
      'amount',
      'category',
      'type',
      'name',
      'description',
      'date',
      'targetAmount',
      'budgetAmount',
    ],
  })
);

//TODO routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transaction', transacRoutes);
app.use('/api/v1/categorie', categorieRoutes);
app.use('/api/v1/budget', budgetRoutes);
app.use('/api/v1/goal', goalsRoutes);

// router hundeller for unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handler : its a err first function
app.use(globalErrorHandler);

module.exports = app;
