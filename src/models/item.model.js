const ItemModel = {
  id: null,
  device: '',
  status: 'off',
  room: '',
  description: '',
  image: null,
};

function buildItemWithDefaults(data = {}) {
  return {
    ...ItemModel,
    ...data,
  };
}

export { ItemModel, buildItemWithDefaults };
