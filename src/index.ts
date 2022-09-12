import PhoneNumber, {
  getCountryCodeForRegionCode,
  getExample,
  parsePhoneNumber
} from 'awesome-phonenumber';
import { countries as Countries } from './countries';
import { deepMerge } from './deepmerge';

interface LabelOptions {
  /**
   * If `true`, the dialcode is shown in the label.
   *
   * @default true
   */
  dialcode: boolean;
  /**
   * If `true`, the country code is shown in the label.
   *
   * @default true
   */
  country: boolean;
  /**
   * If `true`, the country flag is shown in the label.
   *
   * @default true
   */
  flag: boolean;
  /**
   * If `true`, a chevron is shown in the label.
   *
   * @default true
   */
  chevron: boolean;
}

interface DropdownOptions {
  /**
   * If `true`, show the dial code in the dropdown.
   *
   * @default true
   */
  dialcode: boolean;
  /**
   * If `true`, show the country name in the dropdown.
   *
   * @default true
   */
  country: boolean;
  /**
   * If `true`, show the country flag in the dropdown.
   *
   * @default true
   */
  flag: boolean;
  /**
   * Vertical margin of dropdown in pixels.
   *
   * @default 8
   */
  margin: number;
}

export interface PhoneInputOptions {
  /**
   * Number format mode, `'national'` or `'international'`, changes how the
   * placeholder is displayed.
   *
   * @default 'international'
   */
  mode: 'national' | 'international';
  /**
   * CSS classname prefix for created elements.
   *
   * @default 'pi'
   */
  className: string;
  /**
   * The initial country to show in the country selector.
   *
   * ISO 3166-1 alpha-2 format.
   *
   * If the input element contains a number with a valid dial code,
   * the country is automatically changed to the corresponding country.
   *
   * @default 'US'
   */
  country: string | null;
  /**
   * If true, an example phone number for the corresponding dial code
   * is set as the placeholder.
   *
   * @default true
   */
  placeholder: boolean;
  /**
   * Object to define options for dropdown layout.
   * Set to `false` to disable country dropdown.
   * Set to `true` to enable dropdown with default options.
   *
   * @default true
   */
  dropdown: DropdownOptions;
  /**
   * Object to define valid countries and shortcuts.
   *
   * @default {}
   */
  countries: {
    /**
     * Array of countries to allow.
     * `include` takes precedence over the `exclude` option.
     * ISO 3166-1 alpha-2 format.
     */
    include?: string[];
    /**
     * Array of countries to exclude.
     * ISO 3166-1 alpha-2 format.
     */
    exclude?: string[];
    /**
     * Array of that should appear at the top of the dropdown list.
     * ISO 3166-1 alpha-2 format.
     */
    shortcuts?: string[];
  };
  /**
   * Object to define valid countries and shortcuts.
   * Set to `false` to remove label completely.
   *
   * @default true
   */
  label: LabelOptions;
}

interface InternalOptions {
  id: string;
  countries: { iso: string; name: string }[];
  label: HTMLElement;
  parent: HTMLElement;
  element: HTMLInputElement;
}

const defaultOptions: PhoneInputOptions = {
  mode: 'international',
  className: 'pi',
  country: 'US',
  placeholder: true,
  dropdown: {
    flag: true,
    country: true,
    dialcode: true,
    margin: 8,
  },
  countries: {},
  label: {
    dialcode: true,
    country: true,
    flag: true,
    chevron: true,
  },
};

const useUtility = (options: PhoneInputOptions) => {
  /**
   * Returns name prefixed with `options.className`.
   *
   * @param name Classname to be prefixed.
   */
  const className = (name: string) => {
    return `${options.className}-${name}`;
  };

  /**
   * Helper method to minimize `setAttribute` clutter.
   *
   * @param element Element to add attributes to.
   * @param attributes Attributes as Record.
   */
  const setAttributes = (
    element: HTMLElement,
    attributes: Record<string, string>,
  ) => {
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
  };

  return { className, setAttributes };
};

const useDropdown = (
  options: PhoneInputOptions & { meta: InternalOptions },
  setCountry: (code: string) => void,
) => {
  if (!options.dropdown) return null;
  const { className, setAttributes } = useUtility(options);

  let list: HTMLElement;
  let highlighted: string | null = null;
  let timeout: NodeJS.Timeout | null = null;
  let sequence = '';

  const init = () => {
    list = document.createElement('ul');
    setAttributes(list, {
      id: options.meta.id,
      role: 'listbox',
    });
    list.tabIndex = -1;
    list.classList.add(className('dropdown'));

    const shortcuts = options.countries?.shortcuts
      ? options.meta.countries.filter(({ iso }) =>
          options.countries?.shortcuts?.includes(iso),
        )
      : [];

    // Create each shortcut entry.
    for (const shortcut of shortcuts) {
      createListItem(shortcut);
    }

    if (shortcuts.length) {
      // Add the separator element if there are shortcuts.
      const separator = document.createElement('div');
      separator.classList.add(className('separator'));
      list.appendChild(separator);
    }

    const countries = options.meta.countries.filter(
      ({ iso }) => !options.countries?.shortcuts?.includes(iso),
    );

    // Add the rest of the countries.
    for (const country of countries) {
      createListItem(country);
    }

    document.body.appendChild(list);

    options.meta.label.addEventListener('keydown', (event) => keydown(event));
    options.meta.label.addEventListener('blur', (event: FocusEvent) => {
      if (!list.contains((event as any).relatedTarget)) {
        close();
      }
    });

    options.meta.label.addEventListener('click', open);
    options.meta.label.addEventListener('keyup', (event) => {
      // Click does not catch 'Enter' key, add separate keyup event listener.
      if (event.key === 'Enter') {
        event.preventDefault();
        // Simulate click on 'Enter' press.
        options.meta.label.click();
      }
    });
  };

  /**
   * Creates a dropdown country entry.
   *
   * @param country
   */
  const createListItem = (country: InternalOptions['countries'][number]) => {
    const element = document.createElement('li');
    element.id = `${options.meta.id}-${country.iso}`;

    // The dialcode for this country.
    const dc = getCountryCodeForRegionCode(country.iso);
    setAttributes(element, {
      role: 'option',
      'data-country-code': country.iso,
      'data-dial-code': dc.toString(), // Not actually used for anything.
    });

    // Add the dialcode, flag and name to list item.
    // Should be possible for user to define the order of these.
    if (options.dropdown.flag) {
      const flag = document.createElement('div');
      flag.classList.add(
        className('flag'),
        `flag-${country.iso.toLowerCase()}`,
      ); // flags.scss class.
      element.appendChild(flag);
    }

    if (options.dropdown.country) {
      const name = document.createElement('span');
      name.classList.add(className('name'));
      name.innerHTML = country.name;
      element.appendChild(name);
    }

    if (options.dropdown.dialcode) {
      const dialcode = document.createElement('span');
      dialcode.classList.add(className('dialcode'));
      dialcode.innerHTML = `+${dc}`;
      element.appendChild(dialcode);
    }

    // Add list item to list.
    list.appendChild(element);

    element.addEventListener('mousemove', () => setHighlighted(country.iso));
    element.addEventListener('click', () => {
      setCountry(country.iso);
      options.meta.element.focus();
      close();
    });
  };

  /**
   * Adds the highlighted class to a dropdown entry.
   *
   * @param country Country iso code.
   */
  const setHighlighted = (country: string) => {
    if (!list || !options.dropdown) return;

    highlighted = country;
    const current = list.querySelector(`[data-country-code='${country}']`);

    for (const item of Array.from(list.children)) {
      item.setAttribute('aria-selected', 'false');
      item.classList.remove('selected', 'highlighted');
    }

    current?.classList.add('highlighted');
  };

  /**
   * Fired on click anywhere in the document.
   *
   * @param event
   */
  const documentClick = (event: MouseEvent) => {
    // Close the dropdown if the click is outside the dropdown itself.
    if (!list.contains(event.target as Node)) close();
  };

  /**
   * Opens the dropdown list.
   */
  const open = () => {
    if (!list || !options.dropdown) return;

    if (list.classList.contains('open')) return; // Already open.

    list.classList.add('open');

    if (options.meta.label) {
      options.meta.label.setAttribute('aria-expanded', 'true');
    }

    setTimeout(() => {
      document.addEventListener('click', documentClick);
    }, 100);

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', resize);
    resize();

    const event = new CustomEvent('opendropdown');
    options.meta.element.dispatchEvent(event);
  };

  /**
   * Closes the dropdown list.
   */
  const close = () => {
    if (!list || !options.dropdown) return;

    if (options.meta.label) {
      options.meta.label.setAttribute('aria-expanded', 'false');
    }

    list.classList.remove('open');

    document.removeEventListener('click', documentClick);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', resize);

    const event = new CustomEvent('closedropdown');
    options.meta.element.dispatchEvent(event);
  };

  /**
   * Positions and resizes dropdown list.
   */
  const resize = () => {
    if (!list || !options.dropdown) return;

    // Space from bottom of input field to the window bottom edge.
    const bottomSpace =
      window.innerHeight - options.meta.parent.getBoundingClientRect().bottom;

    // Space from top of input field to the window top edge.
    const topSpace = options.meta.parent.getBoundingClientRect().top;

    let height, top;
    const flip = topSpace - bottomSpace > bottomSpace;

    if (flip) {
      height = topSpace - options.dropdown.margin * 2;
      if (list.getBoundingClientRect().height < 300) height = list.style.height = '';
      else list.style.height = height + 'px';
      top =
        options.meta.parent.getBoundingClientRect().top -
        list.getBoundingClientRect().height -
        options.dropdown.margin;
    } else {
      height = bottomSpace - options.dropdown.margin * 2;
      if (list.getBoundingClientRect().height < 300) height = list.style.height = '';
      else list.style.height = height + 'px';
      top =
        options.meta.parent.getBoundingClientRect().bottom +
        options.dropdown.margin;
    }

    list.style.width = options.meta.parent.clientWidth + 'px';
    list.style.left = options.meta.parent.getBoundingClientRect().left + 'px';
    list.style.top = top + 'px';
  };

  /**
   * Moves highlight selection up one entry.
   */
  const up = () => {
    if (!list || !options.dropdown) return;

    open();

    let current = list.querySelector(`[data-country-code='${highlighted}']`);

    if (!current) {
      current = list.firstElementChild;
    }

    let previous = current?.previousElementSibling as HTMLElement;
    if (previous.classList.contains(className('separator'))) {
      previous = previous.previousElementSibling as HTMLElement;
    }

    setHighlighted(previous.getAttribute('data-country-code') as string);
    scroll(previous as any, list);
  };

  /**
   * Moves highlight selection down one entry.
   */
  const down = () => {
    if (!list || !options.dropdown) return;

    open();

    let current = list.querySelector(`[data-country-code='${highlighted}']`);

    if (!current) {
      current = list.firstElementChild;
    }

    let next = current?.nextElementSibling as HTMLElement;
    if (next.classList.contains(className('separator'))) {
      next = next.nextElementSibling as HTMLElement;
    }

    setHighlighted(next.getAttribute('data-country-code') as string);
    scroll(next as any, list);
  };

  const keydown = (event: KeyboardEvent) => {
    if (!options.dropdown) return;

    if (event.key === 'Escape') {
      return close();
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission when pressing Enter.
      if (list?.classList.contains('open') && highlighted) {
        setCountry(highlighted);
        return options.meta.element.focus();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      down();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      up();
    } else if (event.key.length === 1 && list?.classList.contains('open')) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      sequence += event.key.toLowerCase();

      timeout = setTimeout(() => {
        sequence = '';
      }, 500);

      const match = options.meta.countries.find(({ name }) =>
        name.toLowerCase().startsWith(sequence),
      );

      if (match) {
        const elementMatch = list.querySelector(
          `[data-country-code='${match.iso}']`,
        ) as HTMLElement;
        if (elementMatch) {
          scroll(elementMatch, list);
          setHighlighted(match.iso);
        }
      }
    }
  };

  /**
   * Scrolls the dropdown list to make the highlighted entry visible.
   *
   * @param element
   * @param container
   */
  const scroll = (element: HTMLElement, container: HTMLElement) => {
    if (!element || !container) return;
    if (element.offsetTop < container.scrollTop) {
      container.scrollTop = element.offsetTop;
    } else {
      const offsetBottom = element.offsetTop + element.offsetHeight;
      const scrollBottom = container.scrollTop + container.offsetHeight;
      if (offsetBottom > scrollBottom) {
        container.scrollTop = offsetBottom - container.offsetHeight;
      }
    }
  };

  init();

  return {
    highlighted,
    close,
    open,
    setHighlighted,
    list: list!,
    scroll,
  };
};

export const attach = (
  element: HTMLInputElement,
  localOptions: Partial<
    Omit<PhoneInputOptions, 'label' | 'dropdown'> & {
      label: Partial<LabelOptions> | boolean;
      dropdown: Partial<DropdownOptions> | boolean;
    }
  > = {},
) => {
  let id: string;
  let options: PhoneInputOptions;

  let dropdown: ReturnType<typeof useDropdown>;
  let utility: ReturnType<typeof useUtility>;
  let parent: HTMLElement, label: HTMLElement;

  let padding = 0;
  let wordspacing = 0;
  let number: PhoneNumber;

  const labels: {
    flag?: HTMLElement;
    country?: HTMLElement;
    chevron?: HTMLElement;
    dialcode?: HTMLElement;
  } = {};

  // The currently selected country. ISO 3166-1 alpha-2 format.
  let country: string;

  // Filtered list of countries that are allowed to display.
  let countries: { iso: string; name: string }[];

  const init = () => {
    if (!element) console.error('Element is null.');
    if (element.hasAttribute('data-phone-input'))
      console.error('Element has already been initialized as phone-input.');

    // Set attribute to prevent initializing multiple times.
    element.setAttribute('data-phone-input', 'true');

    id = uid();
    options = deepMerge(defaultOptions, localOptions) as PhoneInputOptions;
    countries = filter();

    utility = useUtility(options);

    if (!options.dropdown) {
      // Disable the dialcode label if dropdown is disabled.
      options.label.dialcode = false;
    }

    if (options.mode === 'national') {
      // Disable the dialcode label if input is in national mode.
      options.label.dialcode = false;
    }

    if (!localOptions.dropdown) {
      localOptions.dropdown = {};
    } else if (localOptions.dropdown === true) {
      options.dropdown = defaultOptions.dropdown;
    }

    if (!localOptions.label) {
      localOptions.label = {};
    } else if (localOptions.label === true) {
      options.label = defaultOptions.label;
    }

    createDOMStructure();

    if (options.dropdown) {
      dropdown = useDropdown(
        { ...options, meta: { id, countries, label, parent, element } },
        setCountry,
      );
    }

    padding = parseFloat(
      window.getComputedStyle(element, null).getPropertyValue('padding-left'),
    ); // Remember the initial padding the input element had.

    wordspacing = (() => {
      const el = document.createElement('div');
      el.style.display = 'inline-block';
      el.innerHTML = '&nbsp;';
      document.body.appendChild(el);
      const width = el.clientWidth;
      el.remove();
      return width;
    })();

    element.addEventListener('input', (event) =>
      input(event.target as HTMLInputElement, event),
    );
    element.addEventListener('blur', format);

    if (options.country) {
      setCountry(options.country);
    }

    setInitialCountry();

    input(element);

    setTimeout(() => {
      format();
    }, 100);
  };

  const setInitialCountry = () => {
    const number = parsePhoneNumber(element.value);
    const region = number.getRegionCode();
    const dialcode = getCountryCodeForRegionCode(region);
    if (region) {
      element.value = element.value.replace('+' + dialcode, '');
      setCountry(region);
    }
  };

  const input = (target: HTMLInputElement, _event?: Event) => {
    let value = target.value;

    if (options.label.dialcode && country) {
      value = '+' + getCountryCodeForRegionCode(country).toString() + value;
    }

    number = parsePhoneNumber(
      value,
      options.mode === 'national' ? country : undefined,
    );

    const region = number.getRegionCode();

    if (region) {
      setCountry(region, false);
    }

    element.dispatchEvent(new CustomEvent('update', { detail: getNumber() }));
  };

  /**
   * Returns a filtered country list as defined with `countries.exclude` and
   * `countries.include` option.
   */
  const filter = () => {
    let filtered = Countries;

    if (options.countries?.exclude) {
      // Remove countries defined in the exclude array.
      filtered = filtered.filter(
        ({ iso }) => !options.countries?.exclude?.includes(iso),
      );
    } else if (options.countries?.include) {
      // Remove countries NOT defined in the include array.
      filtered = filtered.filter(({ iso }) =>
        options.countries?.include?.includes(iso),
      );
    }

    return filtered;
  };

  /**
   * Creates the DOM structure for the input element; adds the
   * additional elements as defined in the options.
   *
   * Returns the parent container.
   */
  const createDOMStructure = () => {
    parent = document.createElement('div');

    const createLabel = () => {
      label = document.createElement('div');
      label.classList.add(utility.className('label'));

      if (options.dropdown) {
        utility.setAttributes(label, {
          role: 'combobox',
          'aria-controls': id,
          'aria-owns': id,
          'aria-expanded': 'false',
        });
        label.tabIndex = 0;
        label.classList.add(utility.className('with-dropdown'));
      } else {
        // Make label click-through if dropdown is disabled.
        label.style.pointerEvents = 'none';
      }

      if (options.label.flag) {
        labels.flag = document.createElement('div');
        labels.flag.classList.add(utility.className('flag'));
        label.appendChild(labels.flag);
      }

      if (options.label.country) {
        labels.country = document.createElement('div');
        labels.country.classList.add(utility.className('country'));
        label.appendChild(labels.country);
      }

      if (options.label.chevron && options.dropdown) {
        labels.chevron = document.createElement('div');
        labels.chevron.innerHTML = `<svg aria-hidden="true" height="12" width="12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M11.891 9.992a1 1 0 1 1 1.416 1.415l-4.3 4.3a1 1 0 0 1-1.414 0l-4.3-4.3A1 1 0 0 1 4.71 9.992l3.59 3.591 3.591-3.591zm0-3.984L8.3 2.417 4.709 6.008a1 1 0 0 1-1.416-1.415l4.3-4.3a1 1 0 0 1 1.414 0l4.3 4.3a1 1 0 1 1-1.416 1.415z"></path></svg>`;
        labels.chevron.classList.add(utility.className('chevron'));
        label.appendChild(labels.chevron);
      }

      if (options.label.dialcode) {
        labels.dialcode = document.createElement('div');
        labels.dialcode.classList.add(utility.className('dialcode'));
        label.appendChild(labels.dialcode);
      }
    };

    element.parentNode!.insertBefore(parent, element);
    parent.appendChild(element);
    parent.classList.add(options.className);

    if (options.label) {
      createLabel();
      parent.appendChild(label!);
    }

    parent.appendChild(element);

    return { parent, label };
  };

  const formatSpacing = () => {
    label.style.paddingLeft = padding + 'px';
    if (options.label.dialcode) {
      element.style.paddingLeft = label.clientWidth + wordspacing + 'px';
    } else {
      label.style.paddingRight = padding + 'px';
      if (options.label) {
        element.style.paddingLeft = label.clientWidth + 'px';
      } else {
        element.style.paddingLeft = label.clientWidth + padding + 'px';
      }
    }
  };

  /**
   * Triggers formatting of the input text.
   */
  const format = () => {
    formatSpacing();

    try {
      if (!country) return;

      let value = element.value;

      if (options.label.dialcode && country) {
        value = '+' + getCountryCodeForRegionCode(country).toString() + value;
      }

      const significant = parsePhoneNumber(value, country).getNumber(
        'significant',
      );

      number = parsePhoneNumber(significant, country);

      if (options.label.dialcode) {
        element.value = number
          .getNumber(options.mode)
          .replace('+' + getCountryCodeForRegionCode(country).toString(), '')
          .trim();
      } else if (number.getNumber(options.mode)) {
        element.value = number.getNumber(options.mode);
      }
    } catch (error) {
      return;
    }
  };

  const setLabel = () => {
    if (label) {
      if (options.dropdown) {
        label.setAttribute('aria-activedescendant', id + '-' + country);
      }

      if (labels.country) {
        labels.country.innerHTML = country || '';
      }

      if (labels.flag) {
        labels.flag.className = `${utility.className('flag')} flag-${
          country?.toLowerCase() || 'empty'
        }`;
      }

      if (labels.dialcode) {
        if (!country) {
          labels.dialcode.innerText = '';
        } else {
          labels.dialcode.innerText =
            '+' + getCountryCodeForRegionCode(country).toString();
        }
      }
    }
  };

  /**
   * Sets a country as the active country.
   *
   * @param code
   */
  const setCountry = (code: string, doFormat = true) => {
    code = code.toUpperCase();

    const valid = countries.find(({ iso }) => iso === code);

    if (!valid) {
      // Not an allowed country.
      return;
    }

    country = code;
    if (dropdown) {
      dropdown.setHighlighted(country);
    }

    setLabel();

    if (country && options.placeholder) {
      let placeholder = getExample(country, 'mobile').getNumber(options.mode);
      if (options.mode === 'international') {
        if (options.label.dialcode) {
          const prefix = `+${getCountryCodeForRegionCode(country).toString()}`;
          placeholder = placeholder.replace(prefix, '').trim();
        }
      }
      element.setAttribute('placeholder', placeholder);
    }

    if (dropdown?.list) {
      const entry = dropdown.list.querySelector<HTMLElement>(
        `[data-country-code='${country}']`,
      );

      if (entry) {
        entry.setAttribute('aria-selected', 'true');
        entry.classList.add('selected');

        dropdown.scroll(entry, dropdown.list);
      }
    }

    if (doFormat) {
      format();
    } else {
      formatSpacing();
    }

    element.dispatchEvent(
      new CustomEvent('changecountry', {
        detail: country,
      }),
    );

    element.dispatchEvent(new CustomEvent('update', { detail: getNumber() }));
  };

  /**
   * Returns a (not) random unique id.
   */
  const uid = () => {
    return Math.random().toString(36).replace('0.', 'pi-');
  };

  const getNumber = () => {
    if (!number) return null;
    const json = number.toJSON();
    return {
      number: json.number,
      region: json.regionCode,
      type: json.type,
      valid: json.valid,
      possible: json.possible,
      possibility: json.possibility,
      canBeInternationallyDialled: json.canBeInternationallyDialled,
    };
  };

  init();

  return {
    /**
     * Sets the active phone input country.
     *
     * @param code Country code in ISO 3166-1 alpha-2 format.
     */
    setCountry,
    getNumber,
  };
};
