import {
  Action,
  ActionConstructorArgs,
  RunActionArgs,
} from '@/apps/lib/action';
import { GoogleSheets } from '../google-sheets.app';
import { InputConfig } from '@/apps/lib/input-config';
import { z } from 'zod';

export class ListSpreadsheets extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: GoogleSheets;

  id() {
    return 'google-sheets_action_list-spreadsheets';
  }

  name() {
    return 'List Spreadsheets';
  }

  description() {
    return 'Lists all spreadsheets available in your Google Drive';
  }

  aiSchema() {
    return z.object({});
  }

  inputConfig(): InputConfig[] {
    return [];
  }

  async run({
    connection,
  }: RunActionArgs<ConfigValue>): Promise<Spreadsheet[]> {
    const drive = await this.app.googleDrive({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    // Get all spreadsheets from Google Drive
    const spreadSheets = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name)',
    });

    return (
      spreadSheets?.data?.files?.map((file) => {
        return {
          id: file.id,
          name: file.name,
        };
      }) ?? []
    );
  }

  async mockRun(): Promise<Spreadsheet[]> {
    return [
      {
        id: '1',
        name: 'Mock Spreadsheet 1',
      },
      {
        id: '2',
        name: 'Mock Spreadsheet',
      },
    ];
  }
}

type ConfigValue = z.infer<ReturnType<ListSpreadsheets['aiSchema']>>;

type Spreadsheet = {
  id: string;
  name: string;
};