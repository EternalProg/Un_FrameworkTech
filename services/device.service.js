const devices = require('#data/devices.data');

function listDevices(query = {}) {
  let result = [...devices];

  if (query.room) {
    result = result.filter((device) => device.room.toLowerCase() === query.room.toLowerCase());
  }

  return result;
}

function addDevice(data) {
  const nextId = devices.length ? devices[devices.length - 1].id + 1 : 1;

  const newDevice = {
    id: nextId,
    device: data.device,
    status: data.status || 'off',
    room: data.room,
  };

  devices.push(newDevice);
  return newDevice;
}

function updateDevice(id, data) {
  const device = devices.find((item) => item.id === id);
  if (!device) return null;

  Object.assign(device, data);
  return device;
}

function removeDevice(id) {
  const index = devices.findIndex((item) => item.id === id);
  if (index === -1) return false;

  devices.splice(index, 1);
  return true;
}

module.exports = {
  listDevices,
  addDevice,
  updateDevice,
  removeDevice,
};
