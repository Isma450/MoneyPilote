const AppError = require('../utils/appError');
//FIXME - this is not working as expected - we mutate the error object and that's not good practice

// function that creates an operational error, creates an instance of AppError and assigns the error to it
const createOperationalAppError = (err, message, statusCode) => {
  const error = new AppError(message, statusCode);
  Object.assign(error, err);
  error.isOperational = true;
  return error;
};

// function that handles CastError
const handleCastErrorDB = (err) => {
  const message = `Valeur invalide pour ${err.path}: ${err.value}.`;
  return createOperationalAppError(err, message, 400);
};

// function that handles duplicate fields
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Valeur de champ en double : ${value}. Veuillez utiliser une autre valeur !`;
  return createOperationalAppError(err, message, 400);
};

// function that handles validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = ` Votre saisie est invalide: ${errors.join('. ')}`;
  return createOperationalAppError(err, message, 400);
};

// function that handles JWT errors
const handJWTError = () => {
  const message = 'Token invalide. Veuillez vous reconnecter !';
  return new AppError(message, 401);
};

// function that handles JWT expired errors
const handJWTExpiredError = () => {
  const message = 'Votre token a expiré. Veuillez vous reconnecter !';
  return new AppError(message, 401);
};

// function that handles validation errors
const sendErrordev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// function that handles operational errors
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    // console.error('ERROR 🔥', err);
    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Quelque chose a très mal tourné !',
    });
  }
};

// function that handles errors
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrordev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handJWTError();
    if (err.name === 'TokenExpiredError') err = handJWTExpiredError();

    sendErrorProd(err, res);
  }
};

// function that creates a error hundler without mutating the original error object

// module.exports = (err, req, res, next) => {
//     // console.log(err.stack);
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';

//     if (process.env.NODE_ENV === 'development') {
//       sendErrordev(err, res);
//     } else if (process.env.NODE_ENV === 'production') {
//       let error = { ...err };
//       error.message = err.message;

//       if (error.name === 'CastError') error = handleCastErrorDB(error);
//       if (error.code === 11000) error = handleDuplicateFieldsDB(error);
//       if (error.name === 'ValidationError')
//         error = handleValidationErrorDB(error);

//       sendErrorProd(error, res);
//     }
//   };
