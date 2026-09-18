const admin = require('firebase-admin');

// Duas formas de configurar as credenciais:
//
// LOCAL (no teu PC): cria backend/serviceAccountKey.json (ver README) e
// deixa como está abaixo.
//
// EM PRODUÇÃO (Render, Railway, etc.): NÃO envies esse ficheiro para o
// GitHub. Em vez disso, cola o conteúdo completo do JSON numa variável
// de ambiente chamada FIREBASE_SERVICE_ACCOUNT no painel do Render.

let credential;
if(process.env.FIREBASE_SERVICE_ACCOUNT){
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else {
  credential = admin.credential.cert(require('./serviceAccountKey.json'));
}

admin.initializeApp({ credential });

const db = admin.firestore();

module.exports = { admin, db };

