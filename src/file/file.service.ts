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

  private isValidPath(filePath: string): boolean {
    // Define a base directory for file access
    const baseDir = path.resolve(process.cwd(), 'allowed_files');
    const resolvedPath = path.resolve(baseDir, filePath);
    return resolvedPath.startsWith(baseDir);
  }

  private isValidUrl(url: URL): boolean {
    // Define allowed domains for URL access
    const allowedDomains = [
      'metadata.google.internal',
      '169.254.169.254'
    ];
    return allowedDomains.includes(url.hostname);
  }

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    try {
      if (file.startsWith('/')) {
        if (!this.isValidPath(file)) {
          throw new Error('Access to this file path is not allowed');
        }
        await fs.promises.access(file, R_OK);

        return fs.createReadStream(file);
      } else if (file.startsWith('http')) {
        // Validate URL
        let url;
        try {
          url = new URL(file);
        } catch (err) {
          throw new Error(`Invalid URL: ${file}`);
        }

        // Check if the URL is within allowed domains
        if (!this.isValidUrl(url)) {
          throw new Error(`Access to the domain '${url.hostname}' is not allowed`);
        }

        // Additional validation to prevent SSRF
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error(`Unsupported URL protocol: ${url.protocol}`);
        }

        const content = await this.cloudProviders.get(file);

        if (content) {
          return Readable.from(content);
        } else {
          throw new Error(`no such file or directory, access '${file}'`);
        }
      } else {
        if (!this.isValidPath(file)) {
          throw new Error('Access to this file path is not allowed');
        }
        file = path.resolve(process.cwd(), file);

        await fs.promises.access(file, R_OK);

        return fs.createReadStream(file);
      }
    } catch (err) {
      this.logger.error(`Error accessing file: ${err.message}`);
      throw new Error('An error occurred while accessing the file.');
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
