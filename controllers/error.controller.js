const { sendError } = require('#utils/response');

function getError({ res }) {
  sendError(res, 500, 'Internal Server Error');
}

module.exports = {
  getError,
};
