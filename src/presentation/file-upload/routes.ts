import { Router } from 'express';
// import { AuthMiddleware } from '../middlewares/auth.middleware';
import { FileUploaderController } from './controller';
import { FileUploadService } from '../services/file-upload.service';
import { FileUploadMiddleware } from '../middlewares/file-upload.middleware';
import { TypeMiddleware } from '../middlewares/type.middleware';

export class FileUploadRoutes {


  static get routes(): Router {

    const router = Router();
    const controller = new FileUploaderController(new FileUploadService());

    //middleware para esta rutas en general de fileUpload
    router.use(FileUploadMiddleware.containFiles);
    router.use(TypeMiddleware.validTypes(['users', 'products', 'categories']));
    
    // Definir las rutas
    router.post('/single/:type',  controller.uploadFile);
    router.post('/multiple/:type', controller.uploadMultipleFile);



    return router;
  }


}

