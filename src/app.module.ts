import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma/prisma.module';
// import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [UserModule, ProductModule,PrismaModule],
  controllers: [],
  providers: [],
})

export class AppModule{}

