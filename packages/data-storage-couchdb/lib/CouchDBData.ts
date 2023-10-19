import {
  AttachAttachmentToDatum,
  GetAllAttachmentInfoFromDatum,
  GetAttachmentFromDatum,
  GetAttachmentInfoFromDatum,
  GetConfig,
  GetData,
  GetDataCount,
  GetDatum,
  GetRelated,
  SaveDatum,
  UpdateConfig,
} from '@deps/data/types';

import getAttachAttachmentToDatum from './functions/getAttachAttachmentToDatum';
import getGetAllAttachmentInfoFromDatum from './functions/getGetAllAttachmentInfoFromDatum';
import getGetAttachmentFromDatum from './functions/getGetAttachmentFromDatum';
import getGetAttachmentInfoFromDatum from './functions/getGetAttachmentInfoFromDatum';
import getGetConfig from './functions/getGetConfig';
import getGetData from './functions/getGetData';
import getGetDataCount from './functions/getGetDataCount';
import getGetDatum from './functions/getGetDatum';
import getGetRelated from './functions/getGetRelated';
import getGetViewData, { GetViewData } from './functions/getGetViewData';
import getSaveDatum from './functions/getSaveDatum';
import getUpdateConfig from './functions/getUpdateConfig';
import { Context } from './functions/types';

export default class CouchDBData {
  public getConfig: GetConfig;
  public updateConfig: UpdateConfig;
  public getDatum: GetDatum;
  public getData: GetData;
  public getDataCount: GetDataCount;
  public getRelated: GetRelated;
  public saveDatum: SaveDatum;
  public attachAttachmentToDatum: AttachAttachmentToDatum;
  public getAttachmentInfoFromDatum: GetAttachmentInfoFromDatum;
  public getAttachmentFromDatum: GetAttachmentFromDatum;
  public getAllAttachmentInfoFromDatum: GetAllAttachmentInfoFromDatum;
  public getViewData: GetViewData;

  constructor(context: Context) {
    this.getConfig = getGetConfig(context);
    this.updateConfig = getUpdateConfig(context);
    this.getDatum = getGetDatum(context);
    this.getData = getGetData(context);
    this.getDataCount = getGetDataCount(context);
    this.getRelated = getGetRelated(context);
    this.saveDatum = getSaveDatum(context);
    this.attachAttachmentToDatum = getAttachAttachmentToDatum(context);
    this.getAttachmentInfoFromDatum = getGetAttachmentInfoFromDatum(context);
    this.getAttachmentFromDatum = getGetAttachmentFromDatum(context);
    this.getAllAttachmentInfoFromDatum =
      getGetAllAttachmentInfoFromDatum(context);
    this.getViewData = getGetViewData(context);
  }
}
