# Poker Multiplayer WebSocket

Jogo de Poker Texas Hold'em multiplayer em tempo real, feito com React, Node.js e WebSocket (Socket.io).

## Como rodar o projeto

### 1. Backend (Node.js)

```bash
cd backend
npm install
node JS server.js
```
O backend roda por padrão na porta 5000.

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```
O frontend roda por padrão na porta 5173 (Vite).

---

## Como acessar o jogo

1. Abra o navegador e acesse: [http://localhost:5173](http://localhost:5173)
2. Preencha seu nome e escolha um avatar na tela de cadastro.
3. Clique em "Entrar na Mesa" para começar a jogar.

---

## Como jogar

- O jogo segue as regras do Texas Hold'em:
  - Cada jogador recebe 2 cartas.
  - As cartas comunitárias são reveladas em fases: flop (3), turn (1), river (1).
  - O objetivo é formar a melhor mão de 5 cartas.
- As ações disponíveis são:
  - **Check**: passar a vez sem apostar (se não houver aposta a igualar)
  - **Call**: igualar a aposta atual
  - **Raise**: aumentar a aposta
  - **Fold**: desistir da mão
- O pote é dividido corretamente em caso de all-in (side pots).
- O jogador da vez é destacado na mesa.
- O chat permite conversar com todos na mesa.
- Após o showdown, uma nova rodada começa automaticamente.

---

## Requisitos
- Node.js 16+
- npm
- Navegador moderno (Chrome, Firefox, Edge, etc.)

---

## Observações
- O jogo é para fins didáticos e recreativos.
- Para jogar com amigos, todos devem acessar o frontend na mesma rede/localhost.
- Para jogar online, será necessário expor as portas do backend e frontend.

---

Bom jogo! 🃏
