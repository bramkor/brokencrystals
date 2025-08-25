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

  async getFile(file: string): Promise<Stream> {
    this.logger.log(`Reading file: ${file}`);

    if (file.startsWith('/')) {
      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    } else if (file.startsWith('http')) {
      // Validate URL
      const url = new URL(file);
      if (!this.isAllowedHost(url.hostname)) {
        throw new Error(`Access to the host '${url.hostname}' is not allowed`);
      }

      // Ensure the path is valid for the host
      if (!this.isValidPathForHost(url.hostname, url.pathname)) {
        throw new Error(`Access to the path '${url.pathname}' is not allowed for host '${url.hostname}'`);
      }

      const content = await this.cloudProviders.get(file);

      if (content) {
        return Readable.from(content);
      } else {
        throw new Error(`no such file or directory, access '${file}'`);
      }
    } else {
      file = path.resolve(process.cwd(), file);

      await fs.promises.access(file, R_OK);

      return fs.createReadStream(file);
    }
  }

  private isAllowedHost(hostname: string): boolean {
    const allowedHosts = [
      'metadata.google.internal',
      '169.254.169.254', // Added for AWS, Azure, and Digital Ocean
      // Add other allowed hosts here
    ];
    return allowedHosts.includes(hostname);
  }

  private isValidPathForHost(hostname: string, pathname: string): boolean {
    const allowedPaths = {
      'metadata.google.internal': [
        '/computeMetadata/v1/instance',
        // Add other allowed paths for this host
      ],
      '169.254.169.254': [
        '/latest/meta-data/', // AWS
        '/metadata/instance', // Azure
        '/metadata/v1', // Digital Ocean
        '/metadata/v1.json', // Digital Ocean JSON
        // Add other allowed paths for this host
      ],
      // Define allowed paths for other hosts if needed
    };
    return allowedPaths[hostname]?.includes(pathname) || false;
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
