'use strict';
const morgan = require('morgan');
const cors = require('cors');

const app = module.exports = require('express')();

const eventRouter = require(__dirname + '/../event/routes');

app.use(morgan('dev'));
// app.use(
//   cors({
//     origin: process.env.CORS_ORIGINS.split(' '),
//     credentials: true,
//   })
// );

app.use('/api/v1', eventRouter);


app.use((err, req, res, next) => {
  console.log(err.status, err.message);
  let status = err.status || 400;
  let message = err.message || 'oh no server error';
  res.status(status).send(message);
  next();
});
