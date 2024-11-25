import {
  Action,
  RunActionArgs,
  ActionConstructorArgs,
} from '@/apps/lib/action';
import { InputConfig } from '@/apps/lib/input-config';
import { z } from 'zod';
import { Math as MathApp } from '../math.app';
import { NodeViewOptions } from '@/apps/lib/trigger';
import { ServerConfig } from '@/config/server.config';

export class Multiplication extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: MathApp;

  id() {
    return 'math_action_multiplication';
  }

  name() {
    return 'Multiplication';
  }

  iconUrl(): null | string {
    return `${ServerConfig.INTEGRATION_ICON_BASE_URL}/apps/${this.app.id}.svg`;
  }

  needsConnection(): boolean {
    return false;
  }

  description() {
    return 'Multiplies two numbers together.';
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
      number1: z.number(),
      number2: z.number(),
    });
  }

  inputConfig(): InputConfig[] {
    return [
      {
        id: 'number1',
        label: 'First Number',
        description: '',
        inputType: 'number',
        required: {
          missingMessage: 'First number is required',
          missingStatus: 'warning',
        },
      },
      {
        id: 'number2',
        label: 'Second Number',
        description: '',
        inputType: 'number',
        required: {
          missingMessage: 'Second number is required',
          missingStatus: 'warning',
        },
      },
    ];
  }

  async run({ configValue }: RunActionArgs<ConfigValue>): Promise<Response> {
    const num1 = Number(configValue.number1);
    const num2 = Number(configValue.number2);

    return { result: num1 * num2 };
  }

  async mockRun(): Promise<unknown> {
    return { result: 42 };
  }
}

type ConfigValue = z.infer<ReturnType<Multiplication['aiSchema']>>;

type Response = {
  result: number;
};