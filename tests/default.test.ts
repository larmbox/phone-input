/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@testing-library/jest-dom';
import { attach } from '../src';

describe('build dom with default options', () => {
  const element = document.createElement('input');
  element.value = '+1 (639) 653 3275';
  document.body.appendChild(element);

  attach(element);

  it('builds input container markup', () => {
    expect(element).toHaveAttribute('data-phone-input');
    expect(element.value).toBe('639-653-3275');
    expect(document.querySelector('.pi-label')).toBeInTheDocument();

    const parent = document.querySelector('.pi')!;
    expect(parent).toBeInTheDocument();
    expect(element.parentElement).toBe(parent);

    expect(parent.firstChild).toHaveClass('pi-label');
  });

  it('builds dropdown markup', () => {
    const dropdown = document.querySelector('.pi-dropdown')!;
    expect(dropdown).toBeTruthy();
    expect(dropdown).toBeInTheDocument();

    expect(dropdown.children.length).toEqual(244);

    const child = dropdown.children[0];
    expect(child.id.includes('-AF'));
    expect(child).toHaveAttribute('data-country-code');
    expect(child).toHaveAttribute('data-dial-code');

    expect(child.children[0]).toContainHTML('<div class="pi-flag flag-AF"></div>');
    expect(child.children[1]).toContainHTML(
      '<span class="pi-name">Afghanistan</span>',
    );
    expect(child.children[2]).toContainHTML(
      '<span class="pi-dialcode">+93</span>',
    );
  });
});
