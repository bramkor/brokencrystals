import { Logger } from '@nestjs/common';
import { decode, encode } from 'jwt-simple';
import { JwtTokenProcessor as JwtTokenProcessor } from './jwt.token.processor';

export class JwtTokenWithRSASignatureKeysProcessor extends JwtTokenProcessor {
  constructor(
    private publicKey: string,
    private privateKey: string
  ) {
    super(new Logger(JwtTokenWithRSASignatureKeysProcessor.name));
  }

  async validateToken(token: string): Promise<unknown> {
    this.log.debug('Call validateToken');

    // Ensure the algorithm is enforced and not None
    const decodedHeader = decode(token, '', true, 'RS256');
    if (decodedHeader.alg === 'None') {
      throw new Error('Invalid token algorithm');
    }

    // Validate the token using the public key and RS256 algorithm
    return decode(token, this.publicKey, true, 'RS256');
  }

  async createToken(payload: unknown): Promise<string> {
    this.log.debug('Call createToken');

    const token = encode(payload, this.privateKey, 'RS256');
    return token;
  }
}
