require('dotenv').config();
const express = require('express');
const cors = require('cors');
const store = require('./services/store');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;
store.init().finally(() => app.listen(PORT, () => console.log(`Diagnosis Duel API running on http://localhost:${PORT}`)));
