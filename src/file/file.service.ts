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
      const url = new URL(file);
      if (!this.isAllowedHost(url.hostname)) {
        throw new Error('Access to the specified host is not allowed');
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
      '169.254.169.254'
    ];
    // Ensure the hostname is not an IP address or a private network address
    const privateNetworkRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|169\.254\.|::1|fc00:|fe80:|fd00:)/;
    if (privateNetworkRegex.test(hostname) || this.isIpAddress(hostname)) {
      return false;
    }
    return allowedHosts.includes(hostname);
  }

  private isIpAddress(hostname: string): boolean {
    // Check if the hostname is an IP address
    const ipRegex = /^\d{1,3}(\.\d{1,3}){3}$/;
    return ipRegex.test(hostname);
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
