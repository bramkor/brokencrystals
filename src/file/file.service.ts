import { Injectable, Logger } from '@nestjs/common';
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

  private readonly allowedFilePaths = [
    'config/products/crystals',
    // Add other allowed directories here
  ];

  private readonly allowedHosts = [
    // Add allowed hosts here
  ];

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    // Normalize the path to prevent directory traversal
    const normalizedPath = path.normalize(file);

    if (file.startsWith('http')) {
      // Validate URL
      const url = new URL(file);
      if (!this.isAllowedHost(url.hostname)) {
        throw new Error(`Access to the host '${url.hostname}' is not allowed`);
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      const resolvedPath = path.resolve(process.cwd(), normalizedPath);

      if (!this.isAllowedPath(resolvedPath)) {
        throw new Error('Access to this file path is not allowed');
      }

      await fs.promises.access(resolvedPath, R_OK);

      return fs.createReadStream(resolvedPath);
    }
  }

  private isAllowedHost(hostname: string): boolean {
    // Ensure the hostname is within allowed hosts
    return this.allowedHosts.includes(hostname);
  }

  private isAllowedPath(filePath: string): boolean {
    // Ensure the path is within allowed directories
    return this.allowedFilePaths.some(allowedPath => filePath.startsWith(path.normalize(allowedPath)));
  }

  async deleteFile(file: string): Promise<boolean> {
    if (file.startsWith('/')) {
      throw new Error('cannot delete file from this location');
    } else if (file.startsWith('http')) {
      throw new Error('cannot delete file from this location');
    } else {
      const resolvedPath = path.resolve(process.cwd(), path.normalize(file));
      await fs.promises.unlink(resolvedPath);
      return true;
    }
  }
}