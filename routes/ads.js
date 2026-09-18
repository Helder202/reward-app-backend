const express = require('express');
const { db } = require('../firebaseAdmin');

const router = express.Router();

const REVENUE_SHARE = 0.70;       // fração do CPM que o utilizador recebe
const COOLDOWN_MS = 20 * 1000;    // tempo mínimo entre anúncios, evita spam/fraude
const CPM_MIN = 3.80;
const CPM_MAX = 4.70;

// IMPORTANTE (produção):
// Este CPM é simulado. Num app real, substitui isto pelo valor que o TEU
// ad network reporta via callback server-to-server (SSV) depois de
// confirmar que o anúncio foi visto até ao fim. Nunca credites com base
// só numa chamada vinda do browser — isso é fácil de falsificar.
function getSimulatedCPM(){
  return CPM_MIN + Math.random() * (CPM_MAX - CPM_MIN);
}

router.post('/watch', async (req, res) => {
  const { userId } = req.body;
  if(!userId){
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  const userRef = db.collection('users').doc(userId);

  try{
    const result = await db.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const now = Date.now();
      const data = doc.exists ? doc.data() : { balance: 0, lastAdAt: 0, adsWatched: 0 };

      if(now - (data.lastAdAt || 0) < COOLDOWN_MS){
        throw new Error('COOLDOWN');
      }

      const cpm = getSimulatedCPM();
      const adRevenue = cpm / 1000;
      const userShare = adRevenue * REVENUE_SHARE;
      const newBalance = (data.balance || 0) + userShare;

      tx.set(userRef, {
        balance: newBalance,
        lastAdAt: now,
        adsWatched: (data.adsWatched || 0) + 1
      }, { merge: true });

      tx.set(userRef.collection('ad_log').doc(), {
        adRevenue,
        userShare,
        createdAt: now
      });

      return { adRevenue, userShare, balance: newBalance };
    });

    res.json(result);
  } catch(err){
    if(err.message === 'COOLDOWN'){
      return res.status(429).json({ error: 'Espera um pouco antes do próximo anúncio' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar o anúncio' });
  }
});

router.get('/balance/:userId', async (req, res) => {
  try{
    const doc = await db.collection('users').doc(req.params.userId).get();
    const balance = doc.exists ? (doc.data().balance || 0) : 0;
    res.json({ balance });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter saldo' });
  }
});

module.exports = router;
