import {
  ConnectionConstructorArgs,
  OAuth2Connection,
} from '@/apps/lib/connection';
import { InputConfig } from '@/apps/lib/input-config';
import { GoogleDrive } from '../google-drive.app';
import { ServerConfig } from '@/config/server.config';

export class GoogleDriveOAuth2 extends OAuth2Connection {
  constructor(args: ConnectionConstructorArgs) {
    super(args);
  }

  app: GoogleDrive;
  id() {
    return 'google-drive-connection-oauth2';
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
      'https://www.googleapis.com/auth/drive.file',
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