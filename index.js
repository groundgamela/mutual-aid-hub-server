'use strict';
require('dotenv').config();
console.log(process.env.PORT);
const PORT = process.env.PORT || 5000;

const app = require(__dirname + '/lib/server.js');

app.listen(PORT, () => {
  console.log(`listening at port ${PORT}`);
});
