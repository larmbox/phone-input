/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@testing-library/jest-dom';
import { attach } from '../src';

describe('build dom with user defined options', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does not create dropdown', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    attach(element, { dropdown: false });

    const dropdown = document.querySelector('.pi-dropdown')!;
    expect(dropdown).not.toBeInTheDocument();
  });

  it('creates shortcuts', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    attach(element, { countries: { shortcuts: ['US'] } });

    const dropdown = document.querySelector('.pi-dropdown')!;
    expect(dropdown.children[0].id).toContain('-US');
    expect(
      dropdown.children[1].classList.contains('pi-separator'),
    ).toBeTruthy();
  });

  it('excludes countries', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    attach(element, { countries: { exclude: ['US'] } });

    const dropdown = document.querySelector('.pi-dropdown')!;
    expect(dropdown.innerHTML).not.toContain('data-country-code="US"');
  });

  it('includes countries', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);
    attach(element, { countries: { include: ['US'] } });

    const dropdown = document.querySelector('.pi-dropdown')!;
    expect(dropdown.children.length).toBe(1);
    expect(dropdown.children[0].id).toContain('-US');
  });
});
