import {
  ConnectionConstructorArgs,
  OAuth2Connection,
} from '@/apps/lib/connection';
import { InputConfig } from '@/apps/lib/input-config';
import { GoogleSlides } from '../google-slides.app';
import { ServerConfig } from '@/config/server.config';

export class GoogleSlidesOAuth2 extends OAuth2Connection {
  constructor(args: ConnectionConstructorArgs) {
    super(args);
  }

  app: GoogleSlides;
  id() {
    return 'google-slides-connection-oauth2';
  }
  name() {
    return 'OAuth2';
  }
  description() {
    return 'Connect using OAuth2';
  }
  inputConfig(): InputConfig[] {
    return [];
  }
  authorizeUrl(): string {
    return 'https://accounts.google.com/o/oauth2/v2/auth';
  }
  tokenUrl(): string {
    return 'https://oauth2.googleapis.com/token';
  }
  clientId(): string {
    return ServerConfig.INTEGRATIONS.GMAIL_CLIENT_ID;
  }
  clientSecret(): string {
    return ServerConfig.INTEGRATIONS.GMAIL_CLIENT_SECRET;
  }
  scopes(): string[] {
    return [
      'https://www.googleapis.com/auth/presentations',
      'https://www.googleapis.com/auth/drive.readonly',
    ];
  }
  scopeDelimiter(): string {
    return ' ';
  }
  extraAuthParams(): Record<string, string> | null {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }
}