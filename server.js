import express from 'express';
import controllerRouting from './routes/index';

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.json({ limit: '200mb' }));
controllerRouting(app);

app.listen(port, () => console.log(`Server running on port ${port}`));
