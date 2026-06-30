import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx';
import { parsePlanName, parseSpmWorkbook } from '../src/lib/importParser.js';

function workbookBuffer(rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'SPM');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

describe('parsePlanName', () => {
  it('derives the country office, team, type, and biennium', () => {
    expect(parsePlanName('AF / 26-27 / ZMB / Lusaka / Base')).toMatchObject({
      biennium: '26-27',
      budgetCentreCode: 'ZMB',
      centreType: 'country_office',
      teamName: 'Lusaka',
      planType: 'Base'
    });
  });
});

describe('parseSpmWorkbook', () => {
  it('summarizes approved rows, exclusions, aggregates, and warnings', () => {
    const buffer = workbookBuffer([
      ['banner'],
      ['Plan Name', 'Approval Status', 'PE Name', 'Result Output', 'Amount', 'Funding Source'],
      ['AF / 26-27 / ZMB / Team A / Base', 'Approved', 'PE 1', 'Output 1', 10, 'Core'],
      ['AF / 26-27 / ZMB / Team A / Base', 'Approved', 'PE 1', 'Output 1', 5, 'Flexible'],
      ['AF / 26-27 / SLE / Team B / Base', 'Draft', 'PE 2', '', 3, 'Core'],
      ['AF / 26-27 / SLE / Team B / Base', '', '', 'Output 3', 2, 'Core']
    ]);

    const parsed = parseSpmWorkbook(buffer, 'sample.xlsx');
    expect(parsed.totalRows).toBe(4);
    expect(parsed.approvedRows).toBe(2);
    expect(parsed.excludedRows).toBe(2);
    expect(parsed.budgetCentreCount).toBe(1);
    expect(parsed.teamCount).toBe(1);
    expect(parsed.productServiceCount).toBe(1);
    expect(parsed.duplicateCount).toBe(1);
    expect(parsed.missingApprovalCount).toBe(1);
    expect(parsed.missingPeCount).toBe(1);
    expect(parsed.missingOutputCount).toBe(1);
  });
});
