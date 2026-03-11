import { sendError } from '#utils/response';

function getError({ res }) {
  sendError(res, 500, 'Internal Server Error');
}

export { getError };
