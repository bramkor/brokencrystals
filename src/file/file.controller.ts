import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Put,
  Query,
  Res
} from '@nestjs/common';
import {
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { W_OK } from 'constants';
import * as fs from 'fs';
import * as path from 'path';
import { Stream } from 'stream';
import { FileService } from './file.service';
import { FastifyReply } from 'fastify';
import {
  SWAGGER_DESC_DELETE_FILE,
  SWAGGER_DESC_READ_FILE,
  SWAGGER_DESC_READ_FILE_ON_SERVER,
  SWAGGER_DESC_SAVE_RAW_CONTENT
} from './file.controller.swagger.desc';
import { CloudProvidersMetaData } from './cloud.providers.metadata';

@Controller('/api/file')
@ApiTags('Files controller')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(private fileService: FileService) {}

  private getContentType(contentType: string) {
    if (contentType) {
      return contentType;
    } else {
      return 'application/octet-stream';
    }
  }

  private async loadCPFile(cpBaseUrl: string, path: string) {
    if (!path.startsWith(cpBaseUrl)) {
      throw new BadRequestException(`Invalid paramater 'path' ${path}`);
    }

    const file: Stream = await this.fileService.getFile(path);

    return file;
  }

  private isValidPath(inputPath: string): boolean {
    // Basic validation to ensure the path is not a URL
    try {
      const url = new URL(inputPath);
      return false; // If it's a valid URL, return false
    } catch (_) {
      return true; // If it's not a valid URL, it's a valid path
    }
  }

  private isValidAwsPath(inputPath: string): boolean {
    // Ensure the path is not a URL and is within the allowed AWS directory
    const allowedDirectory = '/allowed/aws/directory'; // Example allowed directory
    return this.isValidPath(inputPath) && inputPath.startsWith(allowedDirectory);
  }

  private sanitizePath(inputPath: string): string {
    // Resolve the path to prevent directory traversal
    const basePath = path.resolve('config/products/crystals'); // Base directory
    const resolvedPath = path.resolve(basePath, inputPath);
    if (!resolvedPath.startsWith(basePath)) {
      throw new BadRequestException('Invalid path parameter');
    }
    return resolvedPath;
  }

  @Get()
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      const sanitizedPath = this.sanitizePath(path);
      const file: Stream = await this.fileService.getFile(sanitizedPath);
      const type = this.getContentType(contentType);
      res.type(type);

      return file;
    } catch (err) {
      this.logger.error(err.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ error: 'Internal Server Error' });
    }
  }

  @Get('/google')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadGoogleFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid path parameter for Google');
    }
    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.GOOGLE,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/aws')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadAwsFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidAwsPath(path)) {
      throw new BadRequestException('Invalid path parameter for AWS');
    }
    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.AWS,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/azure')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadAzureFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid path parameter for Azure');
    }
    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.AZURE,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Get('/digital_ocean')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiQuery({ name: 'type', example: 'image/jpg', required: true })
  @ApiHeader({ name: 'accept', example: 'image/jpg', required: true })
  @ApiOkResponse({
    description: 'File read successfully'
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE
  })
  async loadDigitalOceanFile(
    @Query('path') path: string,
    @Query('type') contentType: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    if (!this.isValidPath(path)) {
      throw new BadRequestException('Invalid path parameter for Digital Ocean');
    }
    const file: Stream = await this.loadCPFile(
      CloudProvidersMetaData.DIGITAL_OCEAN,
      path
    );
    const type = this.getContentType(contentType);
    res.type(type);

    return file;
  }

  @Delete()
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/some_file.jpg',
    required: true
  })
  @ApiOperation({
    description: SWAGGER_DESC_DELETE_FILE
  })
  @ApiInternalServerErrorResponse({
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        location: { type: 'string' }
      }
    }
  })
  @ApiOkResponse({
    description: 'File deleted successfully'
  })
  async deleteFile(@Query('path') path: string): Promise<void> {
    await this.fileService.deleteFile(path);
  }

  @Put('raw')
  @ApiQuery({
    name: 'path',
    example: 'some/path/to/file.png',
    required: true
  })
  @ApiOperation({
    description: SWAGGER_DESC_SAVE_RAW_CONTENT
  })
  @ApiOkResponse()
  async uploadFile(
    @Query('path') file: string,
    @Body() raw: string
  ): Promise<string> {
    try {
      if (typeof raw === 'string' || Buffer.isBuffer(raw)) {
        await fs.promises.access(path.dirname(file), W_OK);
        await fs.promises.writeFile(file, raw);
        return `File uploaded successfully at ${file}`;
      }
    } catch (err) {
      this.logger.error(err.message);
      throw err.message;
    }
  }

  @Get('raw')
  @ApiQuery({
    name: 'path',
    example: 'config/products/crystals/amethyst.jpg',
    required: true
  })
  @ApiOperation({
    description: SWAGGER_DESC_READ_FILE_ON_SERVER
  })
  @ApiNotFoundResponse({
    description: 'File not found'
  })
  @ApiOkResponse({
    description: 'Returns requested file'
  })
  async readFile(
    @Query('path') file: string,
    @Res({ passthrough: true }) res: FastifyReply
  ) {
    try {
      const stream = await this.fileService.getFile(file);
      res.type('application/octet-stream');

      return stream;
    } catch (err) {
      this.logger.error(err.message);
      res.status(HttpStatus.NOT_FOUND).send({ error: 'File not found' });
    }
  }
}
