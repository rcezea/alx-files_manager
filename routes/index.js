import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

function controllerRouting(app) {
  // App Controller
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  // User Controller
  app.post('/users', UsersController.postNew);
  app.get('/users/me', UsersController.getMe);

  // Auth Controller
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);

  // Files Controller
  app.post('/files', FilesController.postUpload);
  app.get('/files/:id', FilesController.getShow);
  app.get('/files', FilesController.getIndex);
  app.put('/files/:id/publish', FilesController.putPublish);
  app.put('/files/:id/unpublish', FilesController.putUnpublish);
  app.get('/files/:id/data', FilesController.getFile);
}
export default controllerRouting;
