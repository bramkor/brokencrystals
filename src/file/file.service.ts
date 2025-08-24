import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Readable, Stream } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { CloudProvidersMetaData } from './cloud.providers.metadata';
import { R_OK } from 'constants';
import { URL } from 'url';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private cloudProviders = new CloudProvidersMetaData();

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Validate and sanitize the file path
    if (file.includes('..') || file.includes('\\') || file.includes('%')) {
      throw new BadRequestException('Invalid file path');
    }

    try {
      if (file.startsWith('/')) {
        // Restrict access to a specific directory
        const baseDir = path.resolve(process.cwd(), 'public');
        const resolvedPath = path.resolve(baseDir, '.' + file);

        if (!resolvedPath.startsWith(baseDir)) {
          throw new BadRequestException('Access to this file path is forbidden');
        }

        await fs.promises.access(resolvedPath, R_OK);

        return fs.createReadStream(resolvedPath);
      } else if (file.startsWith('http')) {
        // Validate URL
        let url;
        try {
          url = new URL(file);
        } catch (err) {
          throw new BadRequestException('Invalid URL');
        }

        // Allow only specific hostnames
        const allowedHosts = ['example.com', 'another-example.com'];
        if (!allowedHosts.includes(url.hostname)) {
          throw new BadRequestException('Host not allowed');
        }

        // Ensure the path is not accessing metadata endpoints
        const forbiddenPaths = ['/latest/meta-data/', '/metadata/instance'];
        if (forbiddenPaths.some(path => url.pathname.startsWith(path))) {
          throw new BadRequestException('Access to metadata endpoints is forbidden');
        }

        const content = await this.cloudProviders.get(file);

        if (content) {
          return Readable.from(content);
        } else {
          throw new BadRequestException(`No such file or directory, access '${file}'`);
        }
      } else {
        throw new BadRequestException('Invalid file path format');
      }
    } catch (err) {
      this.logger.error(`Error accessing file: ${err.message}`);
      throw new InternalServerErrorException('An error occurred while accessing the file.');
    }
  }

  async deleteFile(file: string): Promise<boolean> {
    if (file.startsWith('/')) {
      throw new Error('cannot delete file from this location');
    } else if (file.startsWith('http')) {
      throw new Error('cannot delete file from this location');
    } else {
      file = path.resolve(process.cwd(), file);
      await fs.promises.unlink(file);
      return true;
    }
  }
}
