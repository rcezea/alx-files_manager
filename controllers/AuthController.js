import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  /**
   * Should sign in the user by generating a new authentication token
   *
   * By using the header Authorization and the technique of the Basic auth
   * (Base64 of the <email>:<password>), find the user associate to this email
   * and with this password (reminder: we are storing the SHA1 of the password)
   * If no user has been found, return an error Unauthorized with a status code 401
   * Otherwise:
   * Generate a random string (using uuidv4) as token
   * Create a key: auth_<token>
   * Use this key for storing in Redis (by using the redisClient create previously)
   * the user ID for 24 hours
   * Return this token: { "token": "155342df-2399-41da-9e8c-458b6ac52a0c" }
   * with a status code 200
   */
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    const email = auth[0];
    const password = auth[1];

    const user = await dbClient.userCollection.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.password !== sha1(password)) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  /**
   * Should sign out the user based on the token
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * Otherwise, delete the token in Redis and return nothing with a
   * status code 204
   */
  static async getDisconnect(req, res) {
    await redisClient.del(`auth_${req.headers['x-token']}`);
    return res.status(204).end();
  }
}
export default AuthController;
