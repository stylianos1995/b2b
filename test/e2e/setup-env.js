/**
 * Load .env and .env.local from project root before E2E tests run.
 * Jest runs with cwd = project root, so these paths resolve correctly.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
