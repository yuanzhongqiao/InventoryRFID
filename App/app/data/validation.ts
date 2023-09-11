import { ZodIssue } from 'zod';

import appLogger from '@app/logger';

import EPCUtils from '@app/modules/EPCUtils';

import { getConfig } from './functions/config';
import getData from './functions/getData';
import getDatum from './functions/getDatum';
import getRelated from './functions/getRelated';
import { DataTypeName } from './schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from './types';
import { toTitleCase } from './utils';

const logger = appLogger.for({ module: 'data/validation' });

export type ValidationResults = Array<ZodIssue>;

export async function validate(
  datum:
    | DataTypeWithAdditionalInfo<DataTypeName>
    | InvalidDataTypeWithAdditionalInfo<DataTypeName>,
  { db }: { db: PouchDB.Database },
): Promise<ValidationResults> {
  const issues: Array<ZodIssue> = [];
  const config = await getConfig({ db }, { ensureSaved: true });
  const isFromSharedDb =
    typeof datum.config_uuid === 'string' && datum.config_uuid !== config.uuid;

  if (isFromSharedDb) {
    const dbSharingInfo = await getDatum(
      'db_sharing',
      `${datum.config_uuid}--${config.uuid}`,
      {
        db,
        logger,
      },
    );
    const permissions = Array.isArray(dbSharingInfo?.permissions)
      ? dbSharingInfo?.permissions
      : [];
    if (!permissions.includes('write')) {
      issues.push({
        code: 'custom',
        path: [],
        message: 'You are not allowed to change this shared object.',
      });
      return issues;
    }
  }

  switch (datum.__type) {
    case 'collection': {
      if (
        !isFromSharedDb &&
        datum.collection_reference_number &&
        typeof datum.collection_reference_number === 'string'
      ) {
        const collectionReferenceDigits = EPCUtils.getCollectionReferenceDigits(
          {
            companyPrefix: config.rfid_tag_company_prefix,
            iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
          },
        );

        if (
          typeof datum.collection_reference_number === 'string' &&
          datum.collection_reference_number.length > collectionReferenceDigits
        ) {
          issues.push({
            code: 'custom',
            path: ['collection_reference_number'],
            message: `Should have ${collectionReferenceDigits} digits`,
          });
        }

        const dataWithSameCrn = await getData(
          'collection',
          {
            config_uuid: config.uuid,
            collection_reference_number: datum.collection_reference_number,
          },
          {},
          { db, logger },
        );

        if (dataWithSameCrn.some(d => d.__id !== datum.__id)) {
          const dWithSameCrn = dataWithSameCrn.find(
            dd => dd.__id !== datum.__id,
          );
          issues.push({
            code: 'custom',
            path: ['collection_reference_number'],
            message: `Must be unique (reference number ${
              datum.collection_reference_number
            } is already taken by collection "${
              typeof dWithSameCrn?.name === 'string'
                ? dWithSameCrn.name
                : dWithSameCrn?.__id
            }")`,
          });
        }
      }
      break;
    }

    case 'item': {
      let collection;
      if (datum.collection_id && typeof datum.collection_id === 'string') {
        collection = await getDatum('collection', datum.collection_id, {
          db,
          logger,
        });
        if (!collection) {
          issues.push({
            code: 'custom',
            path: ['collection_id'],
            message: `Can't find collection with ID "${datum.collection_id}"`,
          });
        } else if (typeof collection.config_uuid === 'string') {
          if (datum.config_uuid !== collection.config_uuid) {
            issues.push({
              code: 'custom',
              path: ['collection_id'],
              message: `Collection "${collection.config_uuid}" has a different config_uuid ("${collection.config_uuid}") with your item ("${datum.config_uuid}"), you might be attempting to move a shared item to your own collection, which is not supported`,
            });
          }
        }
      }

      if (datum.container_id && typeof datum.container_id === 'string') {
        const container = await getDatum('item', datum.container_id, {
          db,
          logger,
        });
        if (!container) {
          issues.push({
            code: 'custom',
            path: ['container_id'],
            message: `Can't find item with ID "${datum.container_id}"`,
          });
        } else if (!container._can_contain_items) {
          issues.push({
            code: 'custom',
            path: ['container_id'],
            message: `Item with ID "${datum.container_id}" can not be a container`,
          });
        }
      }

      const contents = await getRelated(
        datum as DataTypeWithAdditionalInfo<'item'>,
        'contents',
        {},
        {
          db,
          logger,
        },
      );
      if (contents && contents.length > 0) {
        if (
          !['container', 'generic_container', 'item_with_parts'].includes(
            (datum as DataTypeWithAdditionalInfo<'item'>).item_type || '',
          )
        ) {
          issues.push({
            code: 'custom',
            path: ['item_type'],
            message: `This item already contains items, cannot set item type to ${
              (datum as DataTypeWithAdditionalInfo<'item'>).item_type || 'item'
            }`,
          });
        }
      }

      let hasIARError = false;
      // IAR should be unique
      if (
        !isFromSharedDb &&
        datum._individual_asset_reference &&
        typeof datum._individual_asset_reference === 'string'
      ) {
        const itemsWithSameIAR = await getData(
          'item',
          {
            config_uuid: config.uuid,
            _individual_asset_reference: datum._individual_asset_reference,
          },
          {},
          { db, logger },
        );
        const differentItemsWithSameIAR = itemsWithSameIAR.filter(
          i => i.__id !== datum.__id,
        );
        if (differentItemsWithSameIAR.length > 0) {
          hasIARError = true;
          const i = differentItemsWithSameIAR[0];
          issues.push({
            code: 'custom',
            path: ['item_reference_number'],
            message: `Individual Asset Reference should be unique, but "${
              datum._individual_asset_reference
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            }`,
          });
        }
      }

      // IAR should be able to encode into EPC IAR
      if (
        !isFromSharedDb &&
        datum.item_reference_number &&
        typeof datum.item_reference_number === 'string' &&
        (typeof datum.serial === 'number' ||
          typeof datum.serial === 'undefined') &&
        typeof collection?.collection_reference_number === 'string'
      ) {
        if (collection) {
          try {
            EPCUtils.encodeIndividualAssetReference({
              companyPrefix: config.rfid_tag_company_prefix,
              iarPrefix: config.rfid_tag_individual_asset_reference_prefix,
              collectionReference: collection.collection_reference_number,
              itemReference: datum.item_reference_number,
              serial: datum.serial || 0,
            });
          } catch (e) {
            issues.push({
              code: 'custom',
              path: ['item_reference_number'],
              message: e instanceof Error ? e.message : JSON.stringify(e),
            });
          }
        }
      }

      // EPC tag URI should be valid, we validate it by trying to encode it into hex
      if (
        !isFromSharedDb &&
        datum.epc_tag_uri &&
        typeof datum.epc_tag_uri === 'string'
      ) {
        try {
          EPCUtils.encodeEpcHexFromGiai(datum.epc_tag_uri);
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['epc_tag_uri'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
          });
        }
      }

      // EPC hex should be valid and globally unique
      if (
        !isFromSharedDb &&
        datum.rfid_tag_epc_memory_bank_contents &&
        typeof datum.rfid_tag_epc_memory_bank_contents === 'string' &&
        !hasIARError
      ) {
        try {
          // TODO: verify that rfid_tag_epc_memory_bank_contents is a valid hex
        } catch (e) {
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: e instanceof Error ? e.message : JSON.stringify(e),
          });
        }

        const itemsWithSameRfidTagEpc = await getData(
          'item',
          {
            rfid_tag_epc_memory_bank_contents:
              datum.rfid_tag_epc_memory_bank_contents,
          },
          {},
          { db, logger },
        );
        const differentItemsWithSameRfidTagEpc = itemsWithSameRfidTagEpc.filter(
          i => i.__id !== datum.__id,
        );
        if (differentItemsWithSameRfidTagEpc.length > 0) {
          const i = differentItemsWithSameRfidTagEpc[0];
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: `RFID tag EPC memory bank contents should be unique, but "${
              datum.rfid_tag_epc_memory_bank_contents
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            }`,
          });
        }

        const itemsWithMatchedActualRfidTagEpc = await getData(
          'item',
          {
            actual_rfid_tag_epc_memory_bank_contents:
              datum.rfid_tag_epc_memory_bank_contents,
          },
          {},
          { db, logger },
        );
        const differentItemsWithMatchedActualRfidTagEpc =
          itemsWithMatchedActualRfidTagEpc.filter(i => i.__id !== datum.__id);
        if (differentItemsWithMatchedActualRfidTagEpc.length > 0) {
          const i = differentItemsWithMatchedActualRfidTagEpc[0];
          issues.push({
            code: 'custom',
            path: ['rfid_tag_epc_memory_bank_contents'],
            message: `RFID tag EPC memory bank contents should be unique, but "${
              datum.rfid_tag_epc_memory_bank_contents
            }" is already used by item ${
              typeof i.name === 'string'
                ? `"${i.name}" (ID: ${i.__id})`
                : i.__id
            } as the actual RFID EPC memory bank contents`,
          });
        }
      }

      break;
    }
  }

  return issues;
}

export async function validateDelete(
  d: { __type: DataTypeName; __id: string | undefined; __deleted: boolean },
  { db }: { db: PouchDB.Database },
): Promise<Array<ZodIssue>> {
  const config = await getConfig({ db }, { ensureSaved: true });

  const issues: Array<ZodIssue> = [];

  const originalDatum = await getDatum(d.__type, d.__id || '', {
    db,
    logger,
  });
  const isFromSharedDb =
    typeof originalDatum.config_uuid === 'string' &&
    originalDatum.config_uuid !== config.uuid;
  if (isFromSharedDb) {
    const dbSharingInfo = await getDatum(
      'db_sharing',
      `${originalDatum.config_uuid}--${config.uuid}`,
      {
        db,
        logger,
      },
    );
    const permissions = Array.isArray(dbSharingInfo?.permissions)
      ? dbSharingInfo?.permissions
      : [];
    if (!permissions.includes('write')) {
      issues.push({
        code: 'custom',
        path: [],
        message: 'You are not allowed to delete this shared object.',
      });
      return issues;
    }
  }

  switch (d.__type) {
    case 'collection': {
      const collection = await getDatum('collection', d.__id || '', {
        db,
        logger,
      });
      if (collection) {
        const items = await getRelated(
          collection,
          'items',
          {},
          {
            db,
            logger,
          },
        );

        if (!items) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot check if this collection has no items.',
          });
        } else if (items.length > 0) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot delete a collection that contain items.',
          });
        }
      }
      break;
    }

    case 'item': {
      const item = await getDatum('item', d.__id || '', {
        db,
        logger,
      });
      if (item) {
        const items = await getRelated(
          item,
          'contents',
          {},
          {
            db,
            logger,
          },
        );

        if (!items) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot check if this item has no contents.',
          });
        } else if (items.length > 0) {
          issues.push({
            code: 'custom',
            path: [],
            message: 'Cannot delete a item that contain items.',
          });
        }
      }
      break;
    }
  }

  return issues;
}

export function getValidationResultMessage(
  validationResults: ValidationResults,
  { bullet = '', joinWith = ', ' }: { bullet?: string; joinWith?: string } = {},
) {
  return validationResults
    .map(
      (issue: any) =>
        `${bullet ? `${bullet} ` : ''}${toTitleCase(
          issue.path.join('_').replace(/_/g, ' '),
        )}: ${issue.message.toLowerCase()}`,
    )
    .join(joinWith);
}
