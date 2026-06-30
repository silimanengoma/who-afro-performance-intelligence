import { describe, expect, it } from 'vitest';
import { assertAdmin, connectorIds, integrationEvent, maskConnector } from '../src/lib/integrationRules.js';

describe('integration rules', () => {
  it('loads all connector ids', () => {
    expect(connectorIds).toEqual(['spm', 'gsm', 'hr', 'sso', 'sharepoint', 'powerbi']);
  });

  it('masks connector secrets', () => {
    expect(maskConnector({ connector_id: 'spm', config: { clientSecret: 'abc', safe: true } }).config.clientSecret).toBe('***');
  });

  it('guards admin-only configuration', () => {
    expect(() => assertAdmin({ role: 'pmo' })).toThrow(/Only MSC Admin/);
  });

  it('creates standard integration events', () => {
    expect(integrationEvent('spm', 'sync', 'success')).toBe('integration.spm.sync.completed');
    expect(integrationEvent('gsm', 'sync', 'failed')).toBe('integration.sync.failed');
  });
});
