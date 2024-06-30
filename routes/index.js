import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

// App Controller

// should return if Redis is alive and if the DB is alive
router.get('/status', AppController.getStatus);

// should return the number of users and files in DB
router.get('/stats', AppController.getStats);

// User Controller

// should create a new user in DB
router.post('/users', UsersController.postNew);

// should retrieve the user base on the token used
router.get('/users/me', UsersController.getMe);

// Auth Controller

// should sign in the user by generating a new authentication token
router.get('/connect', AuthController.getConnect);

// should sign out the user based on the token
router.get('/disconnect', AuthController.getDisconnect);

// Files Controller

// should create a new file in DB and in disk
router.post('/files', FilesController.postUpload);

// should retrieve the file document based on the ID
router.get('/files/:id', FilesController.getShow);

// should retrieve all users file documents for a
// specific parentId and with pagination
router.get('/files', FilesController.getIndex);

// should set isPublic to true on the file document based on the ID
router.put('/files/:id/publish', FilesController.putPublish);

// should set isPublic to false on the file document based on the ID
router.put('/files/:id/unpublish', FilesController.putUnpublish);

module.exports = router;
