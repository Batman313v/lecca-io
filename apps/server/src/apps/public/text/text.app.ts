import {
  WorkflowApp,
  WorkflowAppConstructorArgs,
} from '@/apps/lib/workflow-app';
import { Action } from '@/apps/lib/action';
import { Trigger } from '@/apps/lib/trigger';
import { Connection } from '@/apps/lib/connection';
import { Concatenate } from './actions/concatenate.action';
import { Replace } from './actions/replace.action';
import { Search } from './actions/search.action';
import { Split } from './actions/split.action';
import { ServerConfig } from '@/config/server.config';

export class Text extends WorkflowApp {
  constructor(args: WorkflowAppConstructorArgs) {
    super(args);
  }

  id = 'text';
  name = 'Text Helper';
  logoUrl = `${ServerConfig.INTEGRATION_ICON_BASE_URL}/apps/${this.id}.svg`;
  description = `Text helper offered by ${ServerConfig.PLATFORM_NAME}`;
  isPublished = true;
  needsConnection = false;

  connections(): Connection[] {
    return [];
  }

  actions(): Action[] {
    return [
      new Concatenate({ app: this }),
      new Replace({ app: this }),
      new Search({ app: this }),
      new Split({ app: this }),
    ];
  }

  triggers(): Trigger[] {
    return [];
  }
}