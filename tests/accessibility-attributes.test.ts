/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@testing-library/jest-dom';
import { attach } from '../src';

describe('accessibility attributes', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates label attributes', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);

    attach(element);

    const label = document.querySelector('.pi-label')!;

    expect(label.getAttribute('role')).toBe('combobox');
    expect(label).toHaveAttribute('aria-controls');
    expect(label).toHaveAttribute('aria-owns');
    expect(label).toHaveAttribute('aria-expanded');
    expect(label.getAttribute('aria-expanded')).toBe('false');
    expect(label).toHaveAttribute('aria-activedescendant');

    (label as any).click();
    expect(label.getAttribute('aria-expanded')).toBe('true');
  });

  it('creates dropdown attributes', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);

    attach(element);
    const dropdown = document.querySelector('.pi-dropdown')!;

    expect(dropdown.getAttribute('role')).toBe('listbox');
    expect(dropdown.getAttribute('tabindex')).toBe('-1');

    const child = dropdown.children[0];
    expect(child.getAttribute('role')).toBe('option');
  });

  it('skip creation of aria attributes if dropdown disabled', () => {
    const element = document.createElement('input');
    document.body.appendChild(element);

    attach(element, { dropdown: false });

    const label = document.querySelector('.pi-label')!;

    expect(label).not.toHaveAttribute('role');
    expect(label).not.toHaveAttribute('aria-controls');
    expect(label).not.toHaveAttribute('aria-owns');
    expect(label).not.toHaveAttribute('aria-expanded');
    expect(label).not.toHaveAttribute('aria-activedescendant');
  });
});
