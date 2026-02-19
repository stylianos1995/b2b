/**
 * Integration test setup.
 * Ensure DATABASE_URL or TEST_DATABASE_URL is set for tests that need a DB.
 */
const dbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
if (!dbUrl && process.env.CI !== "true") {
  console.warn(
    "DATABASE_URL or TEST_DATABASE_URL not set; integration tests that need DB may fail.",
  );
}
