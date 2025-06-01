const express = require("express");
const router = express.Router();

// Exemplo de rota GET para usuários
router.get("/", (req, res) => {
  res.json({ message: "Rota de usuários funcionando!" });
});

module.exports = router;