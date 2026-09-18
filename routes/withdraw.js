const express = require('express');
const { db } = require('../firebaseAdmin');

const router = express.Router();
const WITHDRAW_MIN = 5.00;

// IMPORTANTE (produção):
// Pagamentos automáticos reais exigem Stripe Connect: cada utilizador
// completa um onboarding (dados bancários/KYC) e o teu backend chama
// stripe.transfers.create() para a conta conectada dele. Isso tem
// requisitos legais (KYC, prevenção de lavagem de dinheiro) que variam
// por país — vale a pena confirmar com um advogado antes de lançar.
// Este endpoint regista o pedido; o pagamento em si fica marcado como
// "pending" para processares manualmente até teres o Connect configurado.

router.post('/', async (req, res) => {
  const { userId } = req.body;
  if(!userId){
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  const userRef = db.collection('users').doc(userId);

  try{
    const withdrawnAmount = await db.runTransaction(async (tx) => {
      const doc = await tx.get(userRef);
      const balance = doc.exists ? (doc.data().balance || 0) : 0;

      if(balance < WITHDRAW_MIN){
        throw new Error('BELOW_MIN');
      }

      tx.set(userRef, { balance: 0 }, { merge: true });
      tx.set(userRef.collection('withdrawals').doc(), {
        amount: balance,
        status: 'pending',
        requestedAt: Date.now()
      });

      return balance;
    });

    res.json({ withdrawnAmount, status: 'pending' });
  } catch(err){
    if(err.message === 'BELOW_MIN'){
      return res.status(400).json({ error: 'Saldo abaixo do mínimo de €' + WITHDRAW_MIN.toFixed(2) });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar levantamento' });
  }
});

module.exports = router;
