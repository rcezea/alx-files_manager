import express from 'express';
import dotenv from 'dotenv';
import controllerRouting from './routes/index';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: '200mb' }));
controllerRouting(app);

app.listen(port, () => console.log(`Server running on port ${port}`));
