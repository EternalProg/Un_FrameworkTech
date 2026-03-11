const { readBody } = require('#utils/body');
const { sendJson, sendError } = require('#utils/response');
const { createValidator, formatAjvErrors } = require('#utils/validation');
const {
  deviceQuerySchema,
  deviceCreateSchema,
  deviceUpdateSchema,
  deviceParamsSchema,
} = require('#validators/device.schema');
const deviceService = require('#services/device.service');

const validateDeviceQuery = createValidator(deviceQuerySchema);
const validateDeviceCreate = createValidator(deviceCreateSchema);
const validateDeviceUpdate = createValidator(deviceUpdateSchema);
const validateDeviceParams = createValidator(deviceParamsSchema);

function validateOrRespond(res, validate, data) {
  const isValid = validate(data);
  if (isValid) return true;

  sendError(res, 400, 'Validation error', formatAjvErrors(validate.errors));
  return false;
}

function listDevices({ res, query }) {
  if (!validateOrRespond(res, validateDeviceQuery, query)) return;

  const items = deviceService.listDevices(query);
  sendJson(res, 200, { count: items.length, items });
}

function createDevice({ req, res }) {
  readBody(req, (err, data) => {
    if (err) {
      sendError(res, 400, err);
      return;
    }

    if (!validateOrRespond(res, validateDeviceCreate, data)) return;

    const device = deviceService.addDevice(data);
    sendJson(res, 201, { message: 'Device added', device });
  });
}

function updateDevice({ req, res, params }) {
  if (!validateOrRespond(res, validateDeviceParams, params)) return;

  readBody(req, (err, data) => {
    if (err) {
      sendError(res, 400, err);
      return;
    }

    if (!validateOrRespond(res, validateDeviceUpdate, data)) return;

    const device = deviceService.updateDevice(params.id, data);
    if (!device) {
      sendError(res, 404, 'Device not found');
      return;
    }

    sendJson(res, 200, { message: 'Device updated', device });
  });
}

function deleteDevice({ res, params }) {
  if (!validateOrRespond(res, validateDeviceParams, params)) return;

  const removed = deviceService.removeDevice(params.id);
  if (!removed) {
    sendError(res, 404, 'Device not found');
    return;
  }

  sendJson(res, 200, { message: 'Device removed' });
}

module.exports = {
  listDevices,
  createDevice,
  updateDevice,
  deleteDevice,
};
