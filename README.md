## react-mobx-choose

### A lightweight and powerful select alternative to let users choose items from many options powered by [mobx](https://mobx.js.org/)

[![Build Status](https://secure.travis-ci.org/nathanboktae/react-mobx-choose.png)](http://travis-ci.org/nathanboktae/react-mobx-choose)

[![SauceLabs Test Status](https://saucelabs.com/browser-matrix/react-mobx-choose.svg)](https://saucelabs.com/u/react-mobx-choose)

### Examples

TBD...

### Properties

- `choices`: If an array or observable array (of any object), they are the items the user chooses from. If an object, grouping is enabled, by properties of the object that have array values as options.
- `selected`: A writable observable for the selected item, or observable array of items for multiselect mode.
- `selectProperty`: The property of the selected object to bind to the `selected` observable. For example, in the above example with people object as choices, if `selectProperty` was `name`, the `selected` observable would be the string matching the `name` property of the object that was selected.
- `disabled`: An expression, observable, or scalar that if is truthy, disables the dropdown, disallowing selection changes or the dropdown to open.
- `disabledItems`: An expression, observable, or scalar of an array of items that are shown (marked with `aria-disabled`) but cannot be selected.

#### Options only for multiple selection

- `max`: An expression or observable number of the maximum items that can be selected. It will not proactively remove items that exceed the max, but disable additional selections until the number of selected items are less than the max.
- `unshift`: A boolean or observable boolean to put selected items to unshift items to the front of the array rather then push them on the end.

See [the tests](https://github.com/nathanboktae/react-mobx-choose/blob/master/tests/tests.js) for more specifics.

### Installation

```
npm install react-mobx-choose
```