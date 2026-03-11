const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

function createValidator(schema) {
  return ajv.compile(schema);
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => {
    if (error.keyword === 'required' && error.params?.missingProperty) {
      return `${error.params.missingProperty} is required`;
    }

    if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
      return `${error.params.additionalProperty} is not allowed`;
    }

    if (error.instancePath) {
      const path = error.instancePath.replace(/^\//, '');
      return `${path} ${error.message}`.trim();
    }

    return error.message;
  });
}

module.exports = {
  createValidator,
  formatAjvErrors,
};
