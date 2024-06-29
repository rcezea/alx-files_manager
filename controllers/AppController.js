// AppController.js
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// app.get('/status', (req, res) => {
//   res.json({
//     "redis": redisClient.isAlive(),
//     "db": dbClient.isAlive()
//   })
// })
export const getStatus = (req, res) => {
  res.status(200).json({
    "redis": redisClient.isAlive(),
    "db": dbClient.isAlive()
  });
};

// app.get('/stats', (req, res) => {
//   res.json({
//     "users": dbClient.nbUsers(),
//     "files": dbClient.nbFiles()
//   })
// })

export const getStats = async (req, res) => {
  res.status(200).json({
    "users": await dbClient.nbUsers(),
    "files": await dbClient.nbFiles()
  });
};
