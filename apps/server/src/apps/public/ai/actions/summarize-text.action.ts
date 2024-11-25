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

export class SummarizeText extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: AI;
  id() {
    return 'ai_action_summarize-text';
  }
  needsConnection() {
    return false;
  }
  name() {
    return 'Summarize Text';
  }
  iconUrl(): null | string {
    return `${ServerConfig.INTEGRATION_ICON_BASE_URL}/actions/${this.id()}.svg`;
  }
  description() {
    return 'Summarizes text';
  }

  aiSchema() {
    return z.object({
      provider: z.string().describe('The AI provider to use'),
      model: z.string().describe('The ID of the model to use'),
      textToSummarize: z.string().min(1).describe('The text to summarize'),
      summaryLength: z
        .enum([
          'a short sentence',
          'a few sentences',
          'a single paragraph',
          'a few paragraphs',
        ])
        .describe('The length of the summary'),
    });
  }
  inputConfig(): InputConfig[] {
    return [
      this.app.dynamicSelectAiProvider(),
      this.app.dynamicSelectLlmModel(),
      this.app.dynamicSelectLlmConnection(),
      {
        id: 'textToSummarize',
        description: 'The text to summarize',
        inputType: 'text',
        label: 'Text to summarize',
        required: {
          missingMessage: 'Text to summarize is required',
          missingStatus: 'warning',
        },
        placeholder: 'Enter text to summarize',
      },
      {
        id: 'summaryLength',
        description: 'Select the length of the summary',
        inputType: 'select',
        selectOptions: [
          {
            label: 'A short sentence',
            value: 'a short sentence',
          },
          {
            label: 'A few sentences',
            value: 'a few sentences',
          },
          {
            label: 'A single paragraph',
            value: 'a single paragraph',
          },
          {
            label: 'A few paragraphs',
            value: 'a few paragraphs',
          },
        ],
        defaultValue: 'a single paragraph',
        label: 'Summary length',
        required: {
          missingMessage: 'Summary length is required',
          missingStatus: 'warning',
        },
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
    const {
      model,
      provider,
      textToSummarize,
      summaryLength,
      __internal__llmConnectionId,
    } = configValue;

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
      messages: [
        {
          role: 'system',
          content: `You summarize the entered text to ${summaryLength}`,
        },
        {
          role: 'user',
          content: textToSummarize,
        },
      ],
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

type ConfigValue = z.infer<ReturnType<SummarizeText['aiSchema']>> & {
  __internal__llmConnectionId?: string;
};

type PromptResponse = {
  response: string;
  usage: LanguageModelUsage;
};