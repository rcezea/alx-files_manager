// index.js
const express = require('express');
import AppController from '../controllers/AppController';
// const { getStatus, getStats } = require('../controllers/AppController');
const { postNew, getMe } = require('../controllers/UsersController');
const { getConnect, getDisconnect } = require('../controllers/AuthController');
const { postUpload, getShow, getIndex, putPublish, putUnpublish } = require('../controllers/FilesController');

const router = express.Router();


router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
router.post('/files', postUpload);
router.get('/files/:id', getShow);
router.get('/files', getIndex);
router.put('/files/:id/publish', putPublish);
router.put('/files/:id/unpublish', putUnpublish)

export default router;
