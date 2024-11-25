import { InputConfig } from '@/apps/lib/input-config';
import { DateTime } from 'luxon';

import {
  RunTriggerArgs,
  TimeBasedPollTrigger,
  TriggerConstructorArgs,
} from '@/apps/lib/trigger';
import { DateStringToMilliOrNull } from '@/apps/utils/date-string-to-milli-or-null';
import { SalesRabbit } from '../sales-rabbit.app';

export class LeadStatusUpdatedOnDevice extends TimeBasedPollTrigger {
  constructor(args: TriggerConstructorArgs) {
    super(args);
  }

  app: SalesRabbit;
  id() {
    return 'sales-rabbit_trigger_lead-status-updated-on-device';
  }
  name() {
    return 'Lead Status Updated on Device';
  }
  description() {
    return 'Triggers when a lead status is updated on the device of a sales rep.';
  }
  inputConfig(): InputConfig[] {
    return [];
  }

  async run({
    connection,
    testing,
    workspaceId,
  }: RunTriggerArgs<unknown>): Promise<(typeof mock)[]> {
    let url = `https://api.salesrabbit.com/leadStatusActivities`;

    // Since the longest poll time we support is 15 minutes, we only need to check for updates in the last 15 minutes
    // But we'll do 16 minutes to be safe. We'll still save the latest timestamp in the pollStorage for this workflow
    let fifteenMinutesAgo = DateTime.utc().minus({ minutes: 16 }).toISO();

    if (testing) {
      // For testing let's increase the chances that actual data returns by setting the date to a year ago.
      // And setting a page limit of 1 to just return one record
      fifteenMinutesAgo = DateTime.utc().minus({ years: 1 }).toISO();
      url += '?perPage=1&page=1';
    }

    const response = await this.app.http.loggedRequest({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.apiKey}`,
        'If-Status-Modified-Since': fifteenMinutesAgo,
      },
      workspaceId,
    });

    return response.data?.data;
  }

  async mockRun(): Promise<(typeof mock)[]> {
    return [mock];
  }

  extractTimestampFromResponse({ response }: { response: typeof mock }) {
    if (response.currentOnDeviceStatusModified.endsWith('Z')) {
      return DateStringToMilliOrNull(response.currentOnDeviceStatusModified);
    } else {
      return DateStringToMilliOrNull(
        response.currentOnDeviceStatusModified + 'Z',
      );
    }
  }
}

const mock = {
  currentLeadCreated: '2022-10-26T18:00:00+00:00',
  currentLeadCustomFields: {},
  currentLeadFirstName: '',
  currentLeadIsActive: false,
  currentLeadLastName: '',
  currentLeadLatitude: 40.4210433,
  currentLeadLongitude: -111.8827517,
  currentLeadModified: '2024-05-29T20:54:35+00:00',
  currentLeadOwnerEmail: 'john.doe@email.com',
  currentLeadOwnerID: 911705181,
  currentOnDeviceStatusCreated: '2024-05-29T20:54:35',
  currentOnDeviceStatusModified: '2024-05-29T20:55:33',
  dispositionID: 74601,
  dispositionLeadID: 34570,
  dispositionLeadStageID: '1',
  dispositionLeadStatusAbbreviation: 'MOVE',
  dispositionLeadStatusID: 210,
  dispositionLeadStatusName: 'New Mover',
  dispositionTimestamp: '2024-05-29T20:54:35+00:00',
  dispositionType: 'User',
  dispositionerID: '911705181',
  dispositionerProximityInFeet: 68,
  dispositionerProximityLatitude: 40.4210968604357,
  dispositionerProximityLongitude: -111.8829876767247,
  dispositionerProximityStatus: 'At location',
};