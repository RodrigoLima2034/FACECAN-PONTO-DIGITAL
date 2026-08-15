const path = require('path');

/**
 * Explicitly set outputFileTracingRoot to avoid Next.js inference warnings when
 * multiple lockfiles are present on the machine/workspace.
 */
module.exports = {
  outputFileTracingRoot: path.join(__dirname),
};
