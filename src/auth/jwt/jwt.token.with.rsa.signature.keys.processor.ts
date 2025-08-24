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

    // Decode the token header to check the algorithm
    const decodedHeader = decode(token, this.publicKey, true, 'RS256');
    if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header) {
      throw new Error('Invalid token');
    }

    const algorithm = decodedHeader.header.alg;
    if (algorithm === 'none') {
      throw new Error('Algorithm none is not allowed');
    }

    return decode(token, this.publicKey, true, 'RS256');
  }

  async createToken(payload: unknown): Promise<string> {
    this.log.debug('Call createToken');

    const token = encode(payload, this.privateKey, 'RS256');
    return token;
  }
}
