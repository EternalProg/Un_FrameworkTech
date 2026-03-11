const userRepository = require('../repositories/user.repository.js');
const formatterPromise = import('../utils/formatter.mjs');

const rolesMap = require('../data/roles.json');

const getPublicUsers = async () => {
  const { formatName } = await formatterPromise;
  const users = await userRepository.findAll();

  return users.map(u => ({
    id: u.id,
    name: formatName(u.name),
    roleName: rolesMap[u.id] || 'Unknown'
  }));
};

const getUserFormatted = async (id) => {
  const { formatName } = await formatterPromise;
  const user = await userRepository.findById(id);
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: formatName(user.name),
    roleName: rolesMap[user.id] || 'Unknown'
  };
};

module.exports = {
  getPublicUsers,
  getUserFormatted
};
