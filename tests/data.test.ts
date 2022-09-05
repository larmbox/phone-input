import { getSupportedRegionCodes } from 'awesome-phonenumber';
import { countries } from '../src/countries';

describe('country data', () => {
  it('has no missing local data', () => {
    const extra: string[] = [];
    for (const country of countries) {
      if (!getSupportedRegionCodes().includes(country.iso)) {
        extra.push(country.iso);
      }
    }
    expect(extra.length).toBe(0);
  });

  it('has no excess local data', () => {
    const missing: string[] = [];
    for (const code of getSupportedRegionCodes()) {
      if (!countries.find(({ iso }) => iso === code)) {
        missing.push(code);
      }
    }
    expect(missing).toStrictEqual(['TA']);
  });
});
