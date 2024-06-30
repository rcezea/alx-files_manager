// utils/authUtils.js
import redisClient from './redis';

async function authenticateUser(req) {
  // eslint-disable-next-line no-return-await
  return await redisClient.get(`auth_${req.headers['x-token']}`);
}

export default authenticateUser;
