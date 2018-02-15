(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['mobx', 'mobx-react', 'react', 'aria-listbox'], function(mobx, mobxReact, React, ariaListbox) {
      return factory(mobx, x => mobxReact.observer(React.createClass(x)), React.createElement, ariaListbox)
    })
  } else if (typeof exports === 'object' && typeof module === 'object') {
    var cjsReact = require('react'),
        cjsMobxReact = require('mobx-react')
    module.exports = factory(require('mobx'), x => cjsMobxReact.observer(cjsReact.createClass(x)), cjsReact.createElement, require('aria-listbox'))
  } else {
    window.Choose = factory(mobx, x => mobxReact.observer(React.createClass(x)), React.createElement, ariaListbox)
  }
})(function(mobx, component, e, ariaListbox) {
  function unwrap(x) {
    return mobx.isBoxedObservable(x) || mobx.isComputed(x) ? x.get() : x
  }
  function isArray(x) {
    return Array.isArray(x) || mobx.isObservableArray(x)
  }
  function toString(x) {
    return x === undefined ? '' : String(x)
  }
  function observableProperty(obj, p, obv) {
    Object.defineProperty(obj, p, {
      enumerable: true,
      get: function() {
        return obv.get()
      },
      set: function(v) {
       obv.set(v)
      }
    })
  }
  function getChoices(rawChoices) {
    if (isArray(rawChoices)) {
      return rawChoices.slice()
    } else {
      if (!rawChoices || typeof rawChoices !== 'object') {
        throw new Error('choices must be specified as an array or object with array properties')
      }
      var choices = Object.keys(rawChoices).map(function(groupName) {
        return {
          name: groupName,
          items: rawChoices[groupName]
        }
      })
      choices.areGrouped = true
      return choices
    }
  }

  return component({
    componentWillMount: function() {
      var comp = this,
          multiple = !!this.props.multiple,
          selectProperty = this.props.selectProperty,
          compProps = ['searchTerm', 'searchProps', 'optionsVisible', 'disabled', 'disabledItems'],
          initialSelected

      if (multiple && !isArray(this.props.selected)) {
        this.props.selected = mobx.observable([])
      }

      this.multiple = multiple
      if (selectProperty) {
        var initalSelectValue = unwrap(this.props.selected)
        if (multiple) {
          initialSelected = []
          if (isArray(initalSelectValue) && initalSelectValue.length) {
            var opts = getChoices(this.props.choices)
            initalSelectValue.forEach(function(v) {
              var match = opts.filter(function(o) {
                return o[selectProperty] === v
              })[0]
              match && initialSelected.push(match)
            })
          }
          this.selected = mobx.observable(initialSelected)
        } else {
          initialSelected = getChoices(this.props.choices).filter(function(o) {
            return o[selectProperty] === initalSelectValue
          })[0]
          observableProperty(comp, 'selected', mobx.observable.shallowBox(initialSelected))
        }
      } else {
        if (multiple) {
          this.selected = mobx.isObservableArray(this.props.selected) ? this.props.selected : mobx.observable([])
        } else {
          compProps.push('selected')
        }
      }

      compProps.forEach(function(p) {
        var obv = mobx.isBoxedObservable(comp.props[p]) ? comp.props[p] : mobx.observable.shallowBox(comp.props[p])
        observableProperty(comp, p, obv)
      })

      this.showSearch = mobx.computed(function() {
        if ('showSearch' in comp.props) {
          var show = unwrap(comp.props.showSearch)
          return typeof show === 'function' ? show() : !!show
        } else {
          var rawChoices = unwrap(comp.props.choices)
          if (!isArray(rawChoices)) {
            return Object.keys(rawChoices).reduce(function(total, key) {
              return total + rawChoices[key].length
            }, 0) > 10
          } else {
            return rawChoices.length > 10
          }
          /*var choices = getChoices(comp.props.choices)
          if (choices.areGrouped) {
            return Object.keys(choices).reduce(function(total, key) {
              return total + choices[key].items.length
            }, 0) > 10
          } else {
            return choices.length > 10
          }*/
        }
      })
      this.lastFocusedAt = new Date(1, 1, 1980)
    },

    initNode: function(el) {
      if (!el) return

      var comp = this
      if (!el.attributes.tabindex) {
        el.setAttribute('tabindex', '0')
      }
     el.addEventListener('focus', function(e) {
        if (comp.disabled) return
        if (!comp.optionsVisible) {
          comp.lastFocusedAt = new Date()
        }
        comp.optionsVisible = true
        setTimeout(function() {
          el.querySelector('[name="choose-search"]').focus()
        }, 10)
      })
      el.addEventListener('blur', comp.closeOnBlur)

      el.addEventListener('keydown', function(e) {
        var code = e.keyCode || e.which,
            isInput = e.target.tagName === 'INPUT' || e.target === el,
            isOption = e.target.getAttribute('role') === 'option',
            handle = function() { e.preventDefault(); e.stopPropagation() },
            firstOption
        if (code === 38 /* up arrow */) {
          handle()
          if (isInput) {
            var options = el.querySelectorAll('[role="option"]')
            if (options.length) {
              options[options.length - 1].setAttribute('tabindex', '0')
              options[options.length - 1].focus()
            }
          } else if (isOption && !e.target.previousElementSibling) {
            el.focus()
          }
        } else if (code === 40 /* down arrow */) {
          handle()
          if (isInput) {
            firstOption = el.querySelector('[role="option"]')
            if (firstOption) {
              firstOption.setAttribute('tabindex', '0')
              firstOption.focus()
            }
          } else if (isOption && !e.target.nextElementSibling) {
            el.focus()
          }
        } else if (code === 13 && isInput) {
          firstOption = el.querySelector('[role="option"]')
          if (firstOption) {
            select(firstOption._chooseOption)
          }
        } else if (code === 27 /* escape */) {
          handle()
          comp.searchTerm = null
          comp.optionsVisible = false
        }
      })

      ariaListbox(el, comp.props.ariaListbox)
      el.addEventListener('selection-changed', function(e) {
        var targetEl = e.added || e.removed || e.selection
        if (targetEl && '_chooseOption' in targetEl) {
          comp.select(targetEl._chooseOption)
        }
      })
    },

    componentDidMount: function() {
      this.initNode(this.el)
    },

    select: function(item) {
      if (this.disabled) return
      if (this.disabledItems && this.disabledItems.indexOf(item) !== -1) return

      var selectProp = this.props.selectProperty
      if (this.multiple) {
        var idx = this.selected.indexOf(item)
        idx === -1 ? this.selected[this.props.unshift ? 'unshift' : 'push'](item) : this.selected.splice(idx, 1)
        if (selectProp) {
          this.props.selected.replace(this.selected.map(function(i) { return i[selectProp] }))
        }
      } else {
        this.selected = item
        if (selectProp) {
          this.props.selected.set(item[selectProp])
        }
        this.el.focus()
        this.optionsVisible = false
      }
    },

    filteredChoices: function (choices) {
      var searchTerm = this.searchTerm || ''
      if (!searchTerm) return choices

      var searchTermUC = searchTerm.toUpperCase(),
          searchProps = this.searchProps,

      predicate = searchProps ?
        function(i) {
          return searchProps.some(function(prop) {
            return i && i[prop] != null && i[prop].toString().toUpperCase().indexOf(searchTermUC) !== -1
          })
        }
      :
        function(i) {
          return i != null && i.toString().toUpperCase().indexOf(searchTermUC) !== -1
        }

      if (choices.areGrouped) {
        return choices.map(function(group) {
          var filteredChildren = group.items.filter(predicate)
          if (filteredChildren.length) {
            return {
              name: group.name,
              items: filteredChildren
            }
          }
        }).filter(function(g) { return !!g })
      } else {
        return choices.filter(predicate)
      }
    },

    toggleShowOptions: function() {
      if (this.disabled) return
      if (new Date() - this.lastFocusedAt > (this.props.focusDebounce || 200)) {
        this.optionsVisible = !this.optionsVisible
      }
    },

    isDisabled: function(item) {
      return (this.disabledItems && this.disabledItems.indexOf(item) !== -1)
          || (this.props.max && this.selected.length >= this.props.max && this.selected.indexOf(item) === -1)
    },

    closeOnBlur: function(e) {
      if (!e.relatedTarget || !this.el.contains(e.relatedTarget)) {
        this.optionsVisible = false
      }
    },

    Match: function(props) {
      var selected = props.selected,
          selectedStr = Array.isArray(selected) ? selected.join(', ') : toString(selected)

      return e('span', null, selectedStr || props.placeholder || '')
    },

    Option: function(props) {
      return e('span', null, toString(props.option))
    },

    GroupHeader: function(props) {
      return e('span', { className: 'choose-group-header' }, props.name)
    },

    render: function() {
      var comp = this,
          multiple = this.multiple,
          selected = multiple ? this.selected.slice() : this.selected,
          hasSelection = multiple ? !!selected.length : selected !== undefined,
          choices = getChoices(unwrap(this.props.choices))

      var filteredChoices = this.filteredChoices(choices)
      this.selectFirst = () => filteredChoices[0]

      function renderOption(option) {
        var isSelected = multiple ? selected.indexOf(option) !== -1 : option === selected
        return e('li', {
          role: 'option',
          'aria-selected': String(isSelected),
          'aria-disabled': comp.isDisabled(option) ? 'true' : undefined,
          ref: function(el) { if (el) { el._chooseOption = option } }
        }, e(comp.props.Option || comp.Option, { option: option, isSelected: isSelected }))
      }

      return e('choose', {
        ref: function(e) { comp.el = e },
        key: 'chooseroot',
        role: 'listbox',
        'aria-disabled': unwrap(this.props.disabled) ? 'true' : undefined,
        className: (this.props.className || '') + ' ' + (this.optionsVisible ? 'choose-choices-open' : ''),
      }, [
        e('div', {
          key: 'choose-match',
          className: 'choose-match' + (hasSelection ? '' : ' choose-no-selection'),
          onClick: comp.toggleShowOptions
        }, e(comp.props.Match || comp.props.Option || comp.Match, {
            selected: selected,
            choices: choices,
            placeholder: 'placeholder' in comp.props ? comp.props.placeholder : 'Choose...',
            key: 'choose-match-child'
          })),
        e('div', { className: 'choose-choices', key: 'choose-choices', }, [
          e('div', {
            className: 'choose-search-wrapper',
            style: { display: comp.showSearch.get() ? undefined : 'none' },
            key: 'sw'
          }, [
            e('input', {
              name: 'choose-search',
              key: 'choose-search',
              type: 'search',
              value: comp.searchTerm,
              onChange: function(e) { comp.searchTerm = e.target.value },
              onKeyDown: function(e) { comp.searchTerm = e.target.value },
              onBlur: comp.closeOnBlur,
              placeholder: comp.props.searchPlaceholder
            })
          ]),
          e('ul', { key: 'topul', className: choices.areGrouped ? 'choose-group' : 'choose-items' },
            choices.areGrouped ?
            filteredChoices.map(function(group) {
              return e('li', { key: 'ligroup' + group.name }, [
                e(comp.props.GroupHeader || comp.GroupHeader, group),
                e('ul', { className: 'choose-items', key: 'groupul' }, group.items.map(renderOption))
              ])
            })
            :
            filteredChoices.map(renderOption))
        ])
      ])
    }
  })
})