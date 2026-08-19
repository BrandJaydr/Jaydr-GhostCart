/**
 * Vitest test setup file
 * Runs before each test suite.
 *
 * TODO: @agent:forge (Stage 2) Add global test database setup/teardown
 * TODO: @agent:forge (Stage 2) Seed fixture data for integration tests
 */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import '@testing-library/jest-dom';
