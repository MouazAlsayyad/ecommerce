import { diskStorage } from 'multer';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const name = file.originalname.split('.')[0]
      const extension = file.originalname.split('.').pop();
      cb(null,name + '-'+ uniqueSuffix + '.' + extension);
    },
  }),
};