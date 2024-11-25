import {
  WorkflowApp,
  WorkflowAppConstructorArgs,
} from '@/apps/lib/workflow-app';
import { OpenAIApiKey } from './connections/openai.api-key';
import { Action } from '@/apps/lib/action';
import { Trigger } from '@/apps/lib/trigger';
import { Connection } from '@/apps/lib/connection';
import openai from 'openai';
import { InputConfig } from '@/apps/lib/input-config';
import { ChatFromText } from './actions/chat-from-text.action';
import { ServerConfig } from '@/config/server.config';
import { createOpenAI } from '@ai-sdk/openai';

export class OpenAI extends WorkflowApp {
  constructor(args: WorkflowAppConstructorArgs) {
    super(args);
  }

  id = 'openai';
  name = 'OpenAI';
  logoUrl = `${ServerConfig.INTEGRATION_ICON_BASE_URL}/apps/openai.svg`;
  description =
    'OpenAI is a powerful AI model provider that can be used to generate human-like text and images.';
  isPublished = true;
  connections(): Connection[] {
    return [new OpenAIApiKey({ app: this })];
  }
  actions(): Action[] {
    return [new ChatFromText({ app: this })];
  }
  triggers(): Trigger[] {
    return [];
  }

  openai({ apiKey }: { apiKey: string }) {
    return createOpenAI({
      apiKey,
    });
  }

  dynamicSelectModel(): InputConfig {
    return {
      label: 'Model',
      id: 'model',
      inputType: 'dynamic-select',
      placeholder: 'Select model',
      description: 'The model to use for generating responses.',
      _getDynamicValues: async ({ connection }) => {
        const OPEN_AI = new openai({
          apiKey: connection.apiKey,
          maxRetries: 2,
          timeout: 60000,
        });

        const models = await OPEN_AI.models.list();

        return (
          models?.data?.map((model) => {
            return {
              value: model.id,
              label: model.id,
            };
          }) ?? []
        );
      },
      required: {
        missingMessage: 'Model is required',
        missingStatus: 'warning',
      },
    };
  }
}