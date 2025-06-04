import { HttpException, Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { AppModuleConfigProperties } from './app.module.config.properties';
import { OrmModuleConfigProperties } from './orm/orm.module.config.properties';
import { AppConfig } from './app.config.api';
import { UserDto } from './users/api/UserDto';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService
  ) {}

  async launchCommand(command: string): Promise<string> {
    this.logger.debug(`launch ${command} command`);

    return new Promise((res, rej) => {
      try {
        // Split the command into executable and arguments
        const [exec, ...args] = command.split(' ');

        // Validate the executable against a whitelist
        const allowedCommands = ['ls', 'echo']; // Add allowed commands here
        if (!allowedCommands.includes(exec)) {
          throw new Error('Command not allowed');
        }

        const ps = spawn(exec, args);

        ps.stdout.on('data', (data: Buffer) => {
          this.logger.debug(`stdout: ${data}`);
          res(data.toString('ascii'));
        });

        ps.stderr.on('data', (data: Buffer) => {
          this.logger.debug(`stderr: ${data}`);
          res(data.toString('ascii'));
        });

        ps.on('error', (err) => rej(err.message));

        ps.on('close', (code) =>
          this.logger.debug(`child process exited with code ${code}`)
        );
      } catch (err) {
        rej(err.message);
      }
    });
  }

  getConfig(): AppConfig {
    this.logger.debug('Called getConfig');
    // Fetch only non-sensitive configuration details
    return {
      awsBucket: this.configService.get<string>(
        AppModuleConfigProperties.ENV_AWS_BUCKET
      ),
      googlemaps: this.configService.get<string>(
        AppModuleConfigProperties.ENV_GOOGLE_MAPS
      )
    };
  }

  getSecrets(): Record<string, string> {
    this.logger.debug('Fetching secrets from environment variables');
    // Fetch secrets from environment variables
    return {
      codeclimate: process.env.CODECLIMATE_REPO_TOKEN || '',
      facebook: process.env.FACEBOOK_TOKEN || '',
      google_b64: process.env.GOOGLE_B64 || '',
      google_oauth: process.env.GOOGLE_OAUTH || '',
      google_oauth_token: process.env.GOOGLE_OAUTH_TOKEN || '',
      heroku: process.env.HEROKU_TOKEN || '',
      hockey_app: process.env.HOCKEY_APP_TOKEN || '',
      outlook: process.env.OUTLOOK_WEBHOOK || '',
      paypal: process.env.PAYPAL_ACCESS_TOKEN || '',
      slack: process.env.SLACK_TOKEN || ''
    };
  }

  async getUserInfo(email: string): Promise<UserDto> {
    try {
      this.logger.debug(`Find a user by email: ${email}`);
      return new UserDto(await this.userService.findByEmail(email));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }
}
