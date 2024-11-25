import {
  Action,
  ActionConstructorArgs,
  RunActionArgs,
} from '@/apps/lib/action';
import { InputConfig } from '@/apps/lib/input-config';
import { z } from 'zod';
import { AI } from '../ai.app';
import { ServerConfig } from '@/config/server.config';
import { generateText, LanguageModelUsage } from 'ai';
import { AiProvider } from '@/modules/global/ai-provider/ai-provider.service';

export class CustomPrompt extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: AI;
  id() {
    return 'ai_action_custom-prompt';
  }
  needsConnection() {
    return false;
  }
  name() {
    return 'Custom Prompt';
  }
  iconUrl(): null | string {
    return `${ServerConfig.INTEGRATION_ICON_BASE_URL}/actions/${this.id()}.svg`;
  }
  description() {
    return 'Prompt an AI model with custom messages';
  }

  aiSchema() {
    return z.object({
      provider: z.string().describe('The AI provider to use'),
      model: z.string().describe('The ID of the model to use'),
      messages: z.array(
        z.object({
          role: z
            .enum(['user', 'system', 'assistant'])
            .describe('Role of the message sender'),
          content: z.string().min(1).describe('The content of the message'),
        }),
      ),
    });
  }
  inputConfig(): InputConfig[] {
    return [
      this.app.dynamicSelectAiProvider(),
      this.app.dynamicSelectLlmModel(),
      this.app.dynamicSelectLlmConnection(),
      {
        id: 'messages',
        occurenceType: 'multiple',
        label: 'Messages',
        description:
          'One or more messages and roles sent to generate a response',
        inputConfig: [
          {
            id: 'role',
            label: 'Role',
            inputType: 'select',
            description:
              'Role of the message sender. The model will use this information when generating a response.',
            selectOptions: [
              {
                value: 'user',
                label: 'User',
              },
              {
                value: 'system',
                label: 'System',
              },
              {
                value: 'assistant',
                label: 'Assistant',
              },
            ],
            required: {
              missingMessage: 'Role is required',
              missingStatus: 'warning',
            },
          },
          {
            id: 'content',
            label: 'Content',
            inputType: 'text',
            description: 'One or more messages sent to generate a response',
            required: {
              missingMessage: 'Content is required',
              missingStatus: 'warning',
            },
          },
        ],
      },
    ];
  }

  async run({
    configValue,
    workspaceId,
    projectId,
    agentId,
    executionId,
    workflowId,
  }: RunActionArgs<ConfigValue>): Promise<PromptResponse> {
    const { model, messages, provider, __internal__llmConnectionId } =
      configValue;

    const { aiProviderClient, isUsingWorkspaceLlmConnection } =
      await this.app.getAiProviderClient({
        connectionId: __internal__llmConnectionId,
        workspaceId,
        projectId,
        provider,
        model,
      });

    if (!isUsingWorkspaceLlmConnection) {
      await this.app.credits.checkIfWorkspaceHasLlmCredits({
        workspaceId,
        aiProvider: provider as AiProvider,
        model,
      });
    }

    const { text, usage } = await generateText({
      model: aiProviderClient,
      messages: messages as any,
    });

    if (!isUsingWorkspaceLlmConnection) {
      const calculatedCreditsFromToken =
        this.app.credits.transformLlmTokensToCredits({
          aiProvider: provider as AiProvider,
          model,
          data: {
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
          },
        });

      await this.app.credits.updateWorkspaceCredits({
        workspaceId,
        creditsUsed: calculatedCreditsFromToken,
        projectId,
        data: {
          ref: {
            agentId,
            executionId,
            workflowId,
          },
          details: {
            actionId: this.id(),
            aiProvider: provider,
            llmModel: model,
            usage: usage,
          },
        },
      });
    }

    return {
      response: text,
      usage: usage,
    };
  }

  async mockRun(): Promise<PromptResponse> {
    return {
      response: 'This is a mock response',
      usage: {
        completionTokens: 100,
        promptTokens: 100,
        totalTokens: 200,
      },
    };
  }
}

type ConfigValue = z.infer<ReturnType<CustomPrompt['aiSchema']>> & {
  __internal__llmConnectionId?: string;
};

type PromptResponse = {
  response: string;
  usage: LanguageModelUsage;
};