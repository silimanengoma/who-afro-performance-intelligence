export const connectorIds = ['spm', 'gsm', 'hr', 'sso', 'sharepoint', 'powerbi'];
export const errorCategories = [
  'authentication_error',
  'authorization_error',
  'network_error',
  'timeout_error',
  'schema_mismatch',
  'missing_required_field',
  'duplicate_record',
  'validation_failed',
  'transformation_failed',
  'unknown_error'
];

export function maskConnector(connector) {
  const config = connector.config ?? {};
  return {
    connectorId: connector.connector_id ?? connector.connectorId,
    connectorName: connector.connector_name ?? connector.connectorName,
    connectorType: connector.connector_type ?? connector.connectorType,
    status: connector.status,
    authType: connector.auth_type ?? connector.authType,
    baseUrl: connector.base_url ?? connector.baseUrl,
    environment: connector.environment,
    lastSyncAt: connector.last_sync_at ?? connector.lastSyncAt,
    lastSyncStatus: connector.last_sync_status ?? connector.lastSyncStatus,
    errorMessage: connector.error_message ?? connector.errorMessage,
    owner: connector.owner,
    enabled: connector.enabled,
    config: Object.fromEntries(Object.entries(config).map(([key, value]) => /secret|token|password|key/i.test(key) ? [key, '***'] : [key, value]))
  };
}

export function assertAdmin(user) {
  if (user?.role !== 'admin') {
    throw Object.assign(new Error('Only MSC Admin can configure or run integration connectors.'), { status: 403 });
  }
}

export function integrationEvent(connectorId, action, status) {
  if (status === 'failed') return 'integration.sync.failed';
  if (connectorId === 'sharepoint' && action === 'upload') return 'integration.sharepoint.upload.completed';
  if (connectorId === 'powerbi') return 'integration.powerbi.dataset.refreshed';
  return `integration.${connectorId}.sync.completed`;
}
