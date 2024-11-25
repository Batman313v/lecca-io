import {
  Action,
  RunActionArgs,
  ActionConstructorArgs,
} from '@/apps/lib/action';
import { InputConfig } from '@/apps/lib/input-config';
import { z } from 'zod';
import { NodeViewOptions } from '@/apps/lib/trigger';
import { CSV } from '../csv.app';
import { ServerConfig } from '@/config/server.config';

export class ConvertCsvToJson extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: CSV;

  id() {
    return 'csv_action_convert-csv-to-json';
  }

  name() {
    return 'Convert CSV to JSON';
  }

  iconUrl(): null | string {
    return `${ServerConfig.INTEGRATION_ICON_BASE_URL}/apps/${this.app.id}.svg`;
  }

  needsConnection(): boolean {
    return false;
  }

  description() {
    return 'Converts a CSV string to a JSON array';
  }

  viewOptions(): null | NodeViewOptions {
    return {
      saveButtonOptions: {
        replaceSaveAndTestButton: {
          label: 'Save & Test',
          type: 'real',
        },
      },
    };
  }

  aiSchema() {
    return z.object({
      csv: z.string().min(1).describe('The csv text'),
      delimiter: z.enum(['comma', 'tab']).describe('Delimiter of the csv text'),
      hasHeaders: z
        .enum(['true', 'false'])
        .describe('true if the csv text has header row'),
    });
  }

  inputConfig(): InputConfig[] {
    return [
      {
        id: 'csv',
        label: 'CSV Text',
        description: 'Comma separated list in text format',
        inputType: 'text',
        required: {
          missingMessage: 'CSV is required',
          missingStatus: 'warning',
        },
      },
      {
        id: 'delimiter',
        label: 'Delimiter',
        description: 'The delimiter type for the CSV Text',
        inputType: 'select',
        selectOptions: [
          {
            label: 'Comma',
            value: 'comma',
          },
          {
            label: 'Tab',
            value: 'tab',
          },
        ],
        required: {
          missingMessage: 'Delimiter type is required',
          missingStatus: 'warning',
        },
      },
      {
        id: 'hasHeaders',
        label: 'CSV has header row?',
        description: '',
        inputType: 'switch',
        switchOptions: {
          checked: 'true',
          unchecked: 'false',
          defaultChecked: false,
        },
      },
    ];
  }

  async run({ configValue }: RunActionArgs<ConfigValue>): Promise<Response> {
    const { csv, delimiter, hasHeaders } = configValue;

    if (csv != null && typeof csv === 'string') {
      throw new Error('The csv should be a string');
    }
    return {
      result: csvToJson(
        csv,
        hasHeaders === 'true',
        delimiter === 'comma' ? ',' : '\t',
      ),
    };
  }

  async mockRun(): Promise<unknown> {
    //THERE IS NO MOCK ON THIS FUNCITON
    return [];
  }
}

function csvToJson(
  csv_text: string,
  has_headers: boolean,
  delimiter_type: string,
) {
  if (csv_text == null) {
    return [];
  }
  const rows: string[] = csv_text.split('\n');
  const headers = has_headers
    ? rows[0].split(delimiter_type)
    : rows[0].split(',').map((_, index) => `${index + 1}`);
  const data = rows.slice(has_headers ? 1 : 0).map((row) => {
    const values = row.split(delimiter_type);
    return headers.reduce(
      (acc, header, index) => {
        acc[header] = values[index];
        return acc;
      },
      {} as Record<string, any>,
    );
  });
  return data;
}

type ConfigValue = z.infer<ReturnType<ConvertCsvToJson['aiSchema']>>;

type Response = {
  result: Record<string, any>[];
};