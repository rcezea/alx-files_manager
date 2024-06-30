import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const getStatus = (req, res) => {
  res.status(200).send({
    "redis": redisClient.isAlive(),
    "db": dbClient.isAlive()
  });
};

const getStats = async (req, res) => {
  res.status(200).send({
    "users": await dbClient.nbUsers(),
    "files": await dbClient.nbFiles()
  });
};

module.exports = { getStatus, getStats };
