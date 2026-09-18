const express = require('express');
const cors = require('cors');

const adsRouter = require('./routes/ads');
const withdrawRouter = require('./routes/withdraw');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/ads', adsRouter);
app.use('/api/withdraw', withdrawRouter);
// GET /api/balance/:userId está definido dentro de routes/ads.js e fica
// acessível aqui como /api/ads/balance/:userId

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Backend a correr em http://localhost:' + PORT);
});
