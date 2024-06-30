import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  /**
   * Should create a new file in DB and in disk
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * To create a file, you must specify:
   * name: as filename
   * type: either folder, file or image
   * parentId: (optional) as ID of the parent (default: 0 -> the root)
   * isPublic: (optional) as boolean to define if the file is public or not
   * (default: false)
   * data: (only for type=file|image) as Base64 of the file content
   * If the name is missing, return an error Missing name with a status code 400
   * If the type is missing or not part of the list of accepted type, return an
   * error Missing type with a status code 400
   * If the data is missing and type != folder, return an error Missing data with a
   * status code 400
   * If the parentId is set:
   * If no file is present in DB for this parentId, return an error Parent not found
   * with a status code 400
   * If the file present in DB for this parentId is not of type folder, return an error
   * Parent is not a folder with a status code 400
   * The user ID should be added to the document saved in DB - as owner of a file
   * If the type is folder, add the new file document in the DB and return the new file
   * with a status code 201
   * Otherwise:
   * All file will be stored locally in a folder (to create automatically if not present):
   * The relative path of this folder is given by the environment variable FOLDER_PATH
   * If this variable is not present or empty, use /tmp/files_manager as storing folder path
   * Create a local path in the storing folder with filename a UUID
   * Store the file in clear (reminder: data contains the Base64 of the file) in this local path
   * Add the new file document in the collection files with these attributes:
   * userId: ID of the owner document (owner from the authentication)
   * name: same as the value received
   * type: same as the value received
   * isPublic: same as the value received
   * parentId: same as the value received - if not present: 0
   * localPath: for a type=file|image, the absolute path to the file save in local
   * Return the new file with a status code 201
   */
  static async postUpload(req, res) {
    // Find user from token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const id = new ObjectId(userId);
    const user = await dbClient.userCollection.findOne({ _id: id });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const file = {
      userId,
      name: req.body.name || null,
      type: req.body.type || null,
      parentId: req.body.parentId || 0,
      isPublic: req.body.isPublic || false,
      data: req.body.data || null,
    };

    if (!file.name) return res.status(400).json({ error: 'Missing name' });
    if (!file.type) return res.status(400).json({ error: 'Missing type' });
    if (!file.data && file.type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (file.parentId !== 0) {
      const parentId = new ObjectId(file.parentId);
      const storedFile = await dbClient.fileCollection.findOne({ _id: parentId });
      if (!storedFile) return res.status(400).json({ error: 'Parent not found' });
      if (storedFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (file.type === 'folder') {
      const newFile = await dbClient.fileCollection.insertOne(file);
      return res.status(201).json({
        id: newFile.insertedId.toString(),
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    }

    const path = process.env.FOLDER_PATH || '/tmp/files_manager';
    fs.mkdirSync(path, { recursive: true });

    try {
      await fs.promises.opendir(path);
      const filename = uuidv4();
      const data = Buffer.from(file.data, 'base64');
      const filePath = `${path}/${filename}`;

      await fs.promises.writeFile(filePath, data);
      file.localPath = filePath;

      const newFile = await dbClient.fileCollection.insertOne(file);
      return res.status(201).json({
        id: newFile.insertedId.toString(),
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Should retrieve the file document based on the ID
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * If no file document is linked to the user and the ID passed as
   * parameter, return an error Not found with a status code 404
   * Otherwise, return the file document
   */
  static async getShow(req, res) {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const file = await dbClient.fileCollection
      .findOne({ userId, _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * should retrieve all users file documents for a specific
   * parentId and with pagination
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * Based on the query parameters parentId and page, return the list of file document
   * parentId:
   * No validation of parentId needed - if the parentId is not linked to any user folder,
   * returns an empty list
   * By default, parentId is equal to 0 = the root
   * Pagination:
   * Each page should be 20 items max
   * page query parameter starts at 0 for the first page. If equals to 1, it means it’s
   * the second page (form the 20th to the 40th), etc.
   * Pagination can be done directly by the aggregate of MongoDB
   */
  static async getIndex(req, res) {
    // Retrieve the parentId
    const parentId = req.query.parentId || 0;

    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const files = await dbClient.fileCollection.aggregate([
      { $match: { parentId } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 1,
          userId: 1,
          name: 1,
          type: 1,
          isPublic: 1,
          parentId: 1,
        },
      },
    ]).toArray();

    return res.status(200).send(files);
  }

  /**
   * Should set isPublic to true on the file document based on the ID
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * If no file document is linked to the user and the ID passed as parameter,
   * return an error Not found with a status code 404
   * Otherwise:
   * Update the value of isPublic to true
   * And return the file document with a status code 200
   */
  static async putPublish(req, res) {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: true,
      },
    };

    const updatedFile = await dbClient.fileCollection.updateOne(param, updateDoc);
    if (!updatedFile) return res.status(404).json({ error: 'Not found' });

    const file = await dbClient.fileCollection.findOne(param);

    return res.status(200).json({
      id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  /**
   * Should set isPublic to false on the file document based on the ID
   *
   * Retrieve the user based on the token:
   * If not found, return an error Unauthorized with a status code 401
   * If no file document is linked to the user and the ID passed as parameter,
   * return an error Not found with a status code 404
   * Otherwise:
   * Update the value of isPublic to false
   * And return the file document with a status code 200
   */
  static async putUnpublish(req, res) {
    // Retrieve user based on the token
    const userId = await redisClient.get(`auth_${req.headers['x-token']}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Retrieve file from user id and file id
    const param = { userId, _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: {
        isPublic: false,
      },
    };

    const updatedFile = await dbClient.fileCollection.updateOne(param, updateDoc);
    if (!updatedFile) return res.status(404).json({ error: 'Not found' });

    const file = await dbClient.fileCollection.findOne(param);
    return res.status(200).json({
      id: file._id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }
}
export default FilesController;
