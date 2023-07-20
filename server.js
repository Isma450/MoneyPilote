//Imports packages
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// uncaught exception(non operational error) using process.on eventlistener
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION!🔥 Shutting down... 🔥');
  // close server and exit process because of uncaught exception
  process.exit(1);
});

// dotenv config
dotenv.config({ path: './config.env' });
const app = require('./app');

//replace password in database url
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// mongoose database connection
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

// server connection
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App Running on port ${port}...`);
});

// unhandled promise rejection (non operational error) using process.on eventlistener
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!🔥 Shutting down... 🔥');
  // close server and exit process because of unhandled rejection
  server.close(() => {
    process.exit(1);
  });
});
