const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { authMiddleware } = require('./middleware/auth');
const { authRouter } = require('./routes/auth');
const { usersRouter } = require('./routes/users');
const { matchesRouter } = require('./routes/matches');

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/matches', authMiddleware, matchesRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`FLURR backend listening on port ${port}`);
});
