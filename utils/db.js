const { MongoClient } = require('mongodb');
import dotenv from 'dotenv';

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then((client) => {
        this.db = client.db(database);
        this.userCollection = this.db.collection('users');
        this.fileCollection = this.db.collection('files');
      })
      .catch((err) => {
        console.error(err);
        return err;
      });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    if (!this.isAlive()) {
      return 0;
    }
    return this.userCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) {
      return 0;
    }
    return this.fileCollection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
