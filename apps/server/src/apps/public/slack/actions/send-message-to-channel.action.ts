import {
  Action,
  ActionConstructorArgs,
  RunActionArgs,
} from '@/apps/lib/action';
import { InputConfig } from '@/apps/lib/input-config';
import { Slack } from '../slack.app';
import { z } from 'zod';
import { ServerConfig } from '@/config/server.config';

export class SendMessageToChannel extends Action {
  constructor(args: ActionConstructorArgs) {
    super(args);
  }

  app: Slack;
  id() {
    return 'slack_action_send-message-to-channel';
  }
  name() {
    return 'Send Message to Channel';
  }
  description() {
    return 'Sends a message to a Slack channel';
  }
  aiSchema() {
    return z.object({
      channelId: z
        .string()
        .min(1)
        .describe('The ID of the channel to send the message to'),
      message: z.string().min(1).describe('The message to send to the channel'),
    });
  }
  inputConfig(): InputConfig[] {
    return [
      {
        id: 'markdown',
        inputType: 'markdown',
        label: '',
        description: '',
        markdown: `Make sure to invite ${ServerConfig.PLATFORM_NAME} to the channel you want to send a message to. You can do this by typing \`/invite @${ServerConfig.PLATFORM_NAME}\` in the channel.`,
      },
      this.app.dynamicSelectChannel(),
      {
        id: 'message',
        label: 'Message',
        description: 'Message to send to the channel',
        inputType: 'text',
        placeholder: 'Add a message',
        required: {
          missingMessage: 'Message is required',
          missingStatus: 'warning',
        },
      },
    ];
  }

  async run({
    configValue,
    connection,
    workspaceId,
  }: RunActionArgs<ConfigValue>): Promise<ResponseType> {
    const url = 'https://slack.com/api/chat.postMessage';

    const data = new URLSearchParams({
      text: configValue.message,
      channel: configValue.channelId,
    });

    const result = await this.app.http.loggedRequest({
      method: 'POST',
      url,
      data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    if (result?.data?.ok) {
      return result.data;
    } else {
      throw new Error(`Failed to send message: ${result.data?.error}`);
    }
  }

  async mockRun(): Promise<ResponseType> {
    return {
      ok: true,
      channel: 'channel-id',
      ts: '0000000000.000000',
      message: {
        user: 'user-id',
        type: 'message',
        ts: '0000000000.000000',
        bot_id: 'bot-id',
        app_id: 'app-id',
        text: 'Message text',
        team: 'team-id',
        bot_profile: {
          id: 'bot-id',
          app_id: 'app-id',
          name: 'Bot Name',
          icons: [],
          deleted: false,
          updated: 1718565923,
          team_id: 'team-id',
        },
        blocks: [],
      },
    };
  }
}

type ResponseType = {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    user: string;
    type: string;
    ts: string;
    bot_id: string;
    app_id: string;
    text: string;
    team: string;
    bot_profile: {
      id: string;
      app_id: string;
      name: string;
      icons: string[];
      deleted: boolean;
      updated: number;
      team_id: string;
    };
    blocks: unknown[];
  };
};

type ConfigValue = z.infer<ReturnType<SendMessageToChannel['aiSchema']>>;