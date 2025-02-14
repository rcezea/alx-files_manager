// controllers/AppController.js
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    if (dbClient.isAlive() && redisClient.isAlive()) {
      return res.send({ redis: true, db: true });
    }
    return res.status(500).send({ error: 'storage not ready' });
  }

  static async getStats(req, res) {
    const numberOfUsers = await dbClient.userCollection.countDocuments();
    const numberOfFiles = await dbClient.fileCollection.countDocuments();
    return res.send({ users: numberOfUsers, files: numberOfFiles });
  }
}
export default AppController;
