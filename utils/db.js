import { MongoClient, ObjectId } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const dbName = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = MongoClient(url, { useUnifiedTopology: true });
    this.connect();
    this.connected = false;
  }

  async connect() {
    await this.client.connect();
    this.connected = true;
    this.db = this.client.db(dbName);
    this.fileCollection = this.db.collection('files');
    this.userCollection = this.db.collection('users');
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    const usersCollection = this.db.collection('users');
    const noOfCollections = await usersCollection.countDocuments({});
    return noOfCollections;
  }

  async nbFiles() {
    const filesCollection = this.db.collection('files');
    const noOfFiles = await filesCollection.countDocuments({});
    return noOfFiles;
  }
}

const dbClient = new DBClient();
export default dbClient;
