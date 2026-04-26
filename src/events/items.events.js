import { EventEmitter } from 'node:events';

const ITEM_EVENT_NAMES = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
};

const itemEvents = new EventEmitter();

export { ITEM_EVENT_NAMES, itemEvents };
