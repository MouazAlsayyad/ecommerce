import { Controller, Get, Post, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImageService } from './image.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/unit/multer.config';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}


  @Post('upload')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const { filename, path } = file;
    const savedImage = await this.imageService.createImage(filename, path);
    return {
      filename:savedImage.filename,
      id: savedImage.id,
      path:savedImage.path

    };
  }

  @Get()
  findAll() {
    return this.imageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imageService.findOne(+id);
  }

  
}
