import PFElement from "../pfelement/pfelement.js";

// Object.assign needs a polyfill as its not supported in IE11
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) { 
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

class PfeSelect extends PFElement {
  static get tag() {
    return "pfe-select";
  }

  get templateUrl() {
    return "pfe-select.html";
  }

  get styleUrl() {
    return "pfe-select.scss";
  }

  get pfeOptions() {
    return this._pfeOptions;
  }

  set pfeOptions(options) {
    this._pfeOptions = options.filter(el => el.selected).length > 1 ? this.handleMultipleSelectedValues(options) : options;
    this.modifyDOM();
  }

  get pfeInvalid() {
    return this.getAttribute('pfe-invalid');
  }

  set pfeInvalid(invalidAttr) {
    if (!invalidAttr) {
      return;
    }
    this.querySelector('select').setAttribute('aria-invalid', invalidAttr);
  }

  static get observedAttributes() {
    return ["pfe-invalid"];
  }

  constructor() {
    super(PfeSelect);
    this._pfeOptions = null;
    this._init = this._init.bind(this);
    this._inputChanged = this._inputChanged.bind(this);

    this.observer = new MutationObserver(this._init);
  }

  connectedCallback() {
    super.connectedCallback();    
    customElements.whenDefined(PfeSelect.tag).then(() => {
      if (this.pfeOptions) {
        this.modifyDOM();
        this._init();
      } else {      
        if (this.children.length) {
          this._init();
        } else {
          console.warn(`${PfeSelect.tag}: The first child in the light DOM must be a supported select tag`);
        }
      }
    });
    this.observer.observe(this, { childList: true });
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    super.attributeChangedCallback(attr, oldValue, newValue);
    if (!this.pfeInvalid) {
      this.pfeInvalid = newValue;
    }
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this._input.removeEventListener("input", this._inputChanged);
  }

  addOptions(options) {
    // Reset the pfeOptions by concatenating newly added options with _pfeOptions
    this._pfeOptions = this._pfeOptions ? this._pfeOptions.concat(options) : options;
  }

  handleMultipleSelectedValues(options) {
    // Warn if options array has more than one selected value set as true
    console.warn(`${PfeSelect.tag}: The first 'selected' option will take precedence over others incase of multiple 'selected' options`);
    // Get the index of the first element with selected "true"
    const firstIndex = options.findIndex(el => el.selected);
    // Update the options array with precedence to first element with selected value as true
    return options.map((el, idx) => {
      el.selected = firstIndex == idx;
      return el;
    });
  }

  modifyDOM() {
    // Create select element
    let pfeSelect = document.createElement('select');
    // Create option element for each element in _pfeOptions array
    this._pfeOptions.map(el => {
      const option = Object.assign(document.createElement('option') , el);      
      pfeSelect.add(option, null);      
    });
    // if select already exists in the DOM then replace the old select with the new _pfeOptions array
    if (this.children.length) {
      const select = this.querySelector('select');
      select.parentNode.replaceChild(pfeSelect, select);
    } else {
      // Otherwise create a new select element
      this.appendChild(pfeSelect);
    }
  }

  _init() {
    this._input = this.querySelector("select");
    if (!this._input) {
      console.warn(`${PfeSelect.tag}: The first child needs to be a select element`);
      return;
    }
    this._input.addEventListener("change", this._inputChanged);
  }

  _inputChanged() {
    this.dispatchEvent(new CustomEvent(`${this.tag}:change`, {
      detail: { value: this._input.value },
      bubbles: true,
      composed: true
    }));
  }

}

PFElement.create(PfeSelect);

export default PfeSelect;
