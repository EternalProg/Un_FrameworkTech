function buildQuery(searchParams) {
  const query = {};

  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  return query;
}

module.exports = {
  buildQuery,
};
