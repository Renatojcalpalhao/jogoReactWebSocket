const express = require("express");
const router = express.Router();

// Exemplo de ranking estático (substitua por dados do banco depois)
const ranking = [
  { id: 1, nome: "Alice", pontos: 1500 },
  { id: 2, nome: "Bob", pontos: 1200 },
  { id: 3, nome: "Carol", pontos: 900 }
];

router.get("/", (req, res) => {
  res.json(ranking);
});

module.exports = router;