describe('react mobx choose', function() {
  var testEl, matchEl, dropdown, multiple, clock,
  people, matchComponent, itemComponent, colors,
  selected, jane, dwane,
  render = ReactDOM.render.bind(ReactDOM),
  e = React.createElement.bind(React),
  testSetup = function(props) {
    if (!props) {
      props = { choices: people, selected: selected }
    }
    if (multiple) {
      props.multiple = true
    }

    var wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    render(e(Choose, props), wrapper)

    testEl = wrapper.firstElementChild
    matchEl = testEl.querySelector('.choose-match')
    dropdown = testEl.querySelector('.choose-choices')
  },
  dispatchEvent = function(cls, type, moreInit, el) {
    var evt = document.createEvent(cls)
    evt.initEvent(type, true, true)
    el = el || testEl
    if (typeof el === 'string') {
      el = testEl.querySelector(el)
    }
    if (typeof moreInit === 'function') {
      moreInit(el, evt)
    }
    el.dispatchEvent(evt)
    return evt
  },
  click = dispatchEvent.bind(null, 'MouseEvent', 'click', null),
  blur = dispatchEvent.bind(null, 'UIEvent', 'blur', null),
  type = function(el, chars) {
    return dispatchEvent('KeyboardEvent', 'keydown', function(el) {
      el.value = chars
    }, el)
  },
  keydown = function(el, key) {
    // Trying to "properly" create a KeyboardEvent is a huge bag of hurt
    return dispatchEvent('UIEvent', 'keydown', function(el, evt) {
      evt.keyCode = evt.code = typeof key === 'string' ? key.charCodeAt(0) : key
    }, el)
  },
  textNodesFor = function(selector) {
    return Array.prototype.map.call(testEl.querySelectorAll(selector), function(el) {
      return el.textContent.trim()
    })
  },
  attributesFor = function(selector, attr) {
    return Array.prototype.map.call(testEl.querySelectorAll(selector), function(el) {
      return el.getAttribute(attr)
    })
  },
  nameAndAge = function(props) {
    var s = props.selected || props.option
    if (s && typeof s.map === 'function') {
      return e('span', null, s.map(function(i) { return i ? i.name + ' - ' + i.age : 'nobody' }).join(', '))
    }
    return e('span', null, s ? s.name + ' - ' + s.age : 'nobody')
  }

  beforeEach(function() {
    selected = multiple ? mobx.observable([]) : mobx.observable.box()
    people = mobx.observable([{
      name: 'Bob',
      age: 31,
      eyeColor: 'brown'
    }, {
      name: 'Jane',
      age: 25,
      eyeColor: 'blue'
    }, {
      name: 'Anne',
      age: 37,
      eyeColor: 'blue'
    }, {
      name: 'Dwane',
      age: 21,
      eyeColor: 'green'
    }, {
      name: 'Tom',
      age: 25,
      eyeColor: 'brown'
    }, {
      name: 'Tori',
      age: 27,
      eyeColor: 'brown'
    }])
    jane = people[1]
    dwane = people[3]
    colors = mobx.observable(['blue', 'brown', 'red'])
    matchComponent = function(item) {
      return multiple ? item.map(function(i) { return i.name }).join(', ') : i.name
    }
    nameComponent = function(item) {
      return item.name + ' - ' + item.age
    }
  })
  afterEach(function() {
    testEl && document.body.removeChild(testEl.parentElement)
    testEl = null
    clock && clock.restore()
  });

  [false, true].forEach(function(m) {
  describe(m ? 'multiple' : 'single', function() {
    before(function() {
      multiple = m
    })
    after(function() {
      multiple = false
    })

    it('should render and update the list of string choices given an observableArray', function() {
      testSetup({ choices: colors, selected: selected })
      textNodesFor('.choose-choices ul li').should.deep.equal(['blue', 'brown', 'red'])

      colors.push('pink')
      textNodesFor('.choose-choices ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
    })

    it('should render and update the list of string choices when an observable is behind a property', function() {
      var props = mobx.observable({ choices: colors, selected: multiple ? [] : undefined })

      testSetup(props)
      textNodesFor('.choose-choices ul li').should.deep.equal(['blue', 'brown', 'red'])

      props.choices.push('pink')
      textNodesFor('.choose-choices ul li').should.deep.equal(['blue', 'brown', 'red', 'pink'])
    })

    it('should use the aria-listbox role and provided className', function() {
      testSetup({ className: 'myclass', choices: people, selected: mobx.observable() })
      testEl.should.have.attribute('role', 'listbox')
      testEl.should.have.class('myclass')
      Array.prototype.forEach.call(testEl.querySelectorAll('li'), function(el) {
        el.should.have.attr('role', 'option')
      })
    })

    it('should show a placeholder if there is no initial value', function() {
      testSetup({ selected: selected, choices: colors })
      matchEl.textContent.should.equal('Choose...')
    })

    it('should show a user-defined placeholder if there is no initial value', function() {
      testSetup({ choices: colors, selected: selected, placeholder: 'Pick a color' })
      matchEl.textContent.should.equal('Pick a color')
    })

    it('should render the initial value if one exists', function() {
      multiple ? selected.set(0, 'blue') : selected.set('blue')
      testSetup({ selected: selected, choices: colors })
      matchEl.textContent.should.equal('blue')
    })

    !m && xit('should update the value when the user chooses new scalar selections, updating dropdown classes', function() {
      testSetup({ selected: selected, choices: colors })
      testEl.should.not.have.class('choose-choices-open')

      click(matchEl)
      testEl.should.have.class('choose-choices-open').and.have.class('choose-choices-opening')

      click('.choose-choices li:nth-child(2)')
      selected.get().should.equal('brown')
      matchEl.textContent.should.equal('brown')
      testEl.should.have.class('choose-choices-closing').and.not.class('choose-choices-open')

      click(matchEl)
      click('.choose-choices li:nth-child(1)')
      selected.get().should.equal('blue')
      matchEl.textContent.should.equal('blue')
    })

    !m && it('should close the dropdown when escape is pressed', function() {
      testSetup({ choices: colors, selected: selected, showSearch: true })

      click(matchEl)
      testEl.should.have.class('choose-choices-open')

      keydown(null, 27 /* enter */)
      testEl.should.not.have.class('choose-choices-open')

      click(matchEl)
      testEl.should.have.class('choose-choices-open')

      keydown('input', 27 /* enter */)
      testEl.should.not.have.class('choose-choices-open')
    })

    !m && it('should update the value to the property of selectProperty if specified', function() {
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'name',
        Match: nameAndAge,
        Option: function(props) {
          return e('span', null, props.option.name + ' - ' + props.option.age)
        }
      })

      click(matchEl)
      textNodesFor('.choose-choices ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])

      click('.choose-choices li:nth-child(2)')
      matchEl.textContent.should.equal('Jane - 25')
      selected.get().should.equal('Jane')

      click(matchEl)
      click('.choose-choices li:nth-child(1)')
      selected.get().should.equal('Bob')
      matchEl.textContent.should.equal('Bob - 31')
    })

    !m && it('should initialize the selection to the first choice matching the selectProperty', function() {
      selected.set('Jane')
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'name',
        Match: nameAndAge
      })
      matchEl.textContent.should.equal('Jane - 25')
    })

    !m && it('should initialize the selection to the first choice matching the selectProperty when falsy', function() {
      selected.set(undefined)
      people[0].eyeColor = null
      people[5].eyeColor = undefined
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'eyeColor',
        Match: nameAndAge
      })
      matchEl.textContent.should.equal('Tori - 27')
    })

    m && it('should update the value to an array of properties of selectProperty if specified', function() {
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'name',
        Option: nameAndAge
      })
      click(matchEl)
      textNodesFor('.choose-choices ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])

      click('.choose-choices li:nth-child(2)')
      selected.slice().should.deep.equal(['Jane'])
      matchEl.textContent.should.equal('Jane - 25')

      click('.choose-choices li:nth-child(1)')
      selected.slice().should.deep.equal(['Jane', 'Bob'])
      matchEl.textContent.should.equal('Jane - 25, Bob - 31')
    })

    !m && it('should update selections when choosen via a keyboard', function() {
      testSetup({ selected: selected, choices: colors })

      click(matchEl)
      keydown('.choose-choices li:nth-child(2)', 13 /* enter */)
      selected.get().should.equal('brown')
      matchEl.textContent.should.equal('brown')
    })

    m && it('should update selections when choosen via a keyboard', function() {
      testSetup({ selected: selected, choices: colors })

      keydown('.choose-choices li:nth-child(2)', 13 /* enter */)
      selected.slice().should.deep.equal(['brown'])
      matchEl.textContent.should.equal('brown')

      keydown('.choose-choices li:nth-child(3)', ' ')
      selected.slice().should.deep.equal(['brown', 'red'])

      keydown('.choose-choices li:nth-child(2)', ' ')
      selected.slice().should.deep.equal(['red'])
    })

    m && it('should initialize the selection to the choices contained in the initial selected', function() {
      selected.replace(['Jane', 'Bob'])
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'name',
        Option: nameAndAge
      })
      matchEl.textContent.should.equal('Jane - 25, Bob - 31')
    })

    m && it('should not fail if an item is removed from selection during the click', function() {
      selected.replace(['Jane', 'Bob'])
      testSetup({
        choices: people,
        selected: selected,
        selectProperty: 'name',
        Option: nameAndAge
      })

      click('.choose-choices li:nth-child(2) span')
    })

    m && it('should unshift rather than push new items if requested', function() {
      testSetup({ selected: selected, choices: colors, unshift: true })

      click('.choose-choices li:nth-child(2)')
      selected.slice().should.deep.equal(['brown'])

      click('.choose-choices li:nth-child(1)')
      selected.slice().should.deep.equal(['blue', 'brown'])
    })

    xit('should use the visible binding if knockout-css3-animation is not available', function() {
      var animationBinding = ko.bindingHandlers.animation
      delete ko.bindingHandlers.animation

      testSetup()
      testEl.style.display.should.equal('')
      dropdown.style.display.should.equal('none')

      click(matchEl)
      dropdown.style.display.should.equal('')

      ko.bindingHandlers.animation = animationBinding
    })

    it('should provide some default templates if none are specified', function() {
      multiple ? selected.replace([jane, dwane]) : selected.set(jane)
      testSetup()

      matchEl.textContent.should.equal(multiple ? '[object Object], [object Object]' : '[object Object]')
      click(matchEl)
      textNodesFor('.choose-choices ul li')[0].should.equal('[object Object]')
    })

    it('should render the item template for each option when provided', function() {
      multiple ? selected.replace([jane, dwane]) : selected.set(jane)
      testSetup({
        choices: people,
        selected: selected,
        Match: function(props) {
          var s = props.selected
          return e('span', null, s ? (multiple ? s.map(function(p){return p.name}).join(', ') : s.name) : '')
        },
        Option: nameAndAge
      })

      matchEl.textContent.should.equal(multiple ? 'Jane, Dwane' : 'Jane')
      click(matchEl)
      textNodesFor('.choose-choices ul li').slice(0,3).should.deep.equal(
        ['Bob - 31', 'Jane - 25', 'Anne - 37'])
    })

    it('should have a choose-no-selection class on choose-match when there is nothing selected', function() {
      testSetup()
      matchEl.should.have.class('choose-no-selection')

      click(matchEl)
      click('.choose-choices li:nth-child(2)')
      matchEl.should.not.have.class('choose-no-selection')
    })

    !m && it('should properly bind when choices are falsy, setting choose-no-selection correctly', function() {
      testSetup({ choices: [true, false, 0, null], selected: selected })
      matchEl.should.have.class('choose-no-selection')

      click(matchEl)
      click('.choose-choices li:nth-child(2)')
      matchEl.should.not.have.class('choose-no-selection')
      matchEl.should.have.text('false')

      click(matchEl)
      click('.choose-choices li:nth-child(3)')
      matchEl.should.not.have.class('choose-no-selection')
      matchEl.should.have.text('0')

      click(matchEl)
      click('.choose-choices li:nth-child(4)')
      matchEl.should.not.have.class('choose-no-selection')
    })

    !m && xit('should update the value when the user chooses new object selections, updating dropdown classes', function() {
      testSetup()
      testEl.should.not.have.class('choose-choices-open')

      click(matchEl)
      testEl.should.have.class('choose-choices-open').and.have.class('choose-choices-opening')

      click('.choose-choices li:nth-child(2)')
      selected.get().should.equal(jane)
      matchEl.textContent.should.equal('Jane')
      testEl.should.have.class('choose-choices-closing')

      click(matchEl)
      click('.choose-choices li:nth-child(4)')
      selected.get().should.equal(dwane)
      matchEl.textContent.should.equal('Dwane')
    })

    it('should close the dropdown when focus is lost on the choose element', function() {
      clock = sinon.useFakeTimers()
      testSetup()
      click(matchEl)
      testEl.should.have.class('choose-choices-open')
      blur(testEl)
      clock.tick(30)
      testEl.should.not.have.class('choose-choices-open')
    })

    it('should close the dropdown when focus is lost on a list item', function() {
      clock = sinon.useFakeTimers()
      testSetup()
      click(matchEl)
      testEl.should.have.class('choose-choices-open')

      var firstItem = testEl.querySelector('ul.choose-items li')
      firstItem.focus()
      testEl.should.have.class('choose-choices-open')

      blur(firstItem)
      clock.tick(30)
      testEl.should.not.have.class('choose-choices-open')
    })

    it('should not open the dropdown on focus or click when disabled', function() {
      var disabled = mobx.observable(true)
      testSetup({
        choices: colors,
        selected: selected,
        disabled: disabled
      })

      testEl.should.have.attribute('aria-disabled', 'true')

      testEl.focus()
      testEl.should.not.have.class('choose-choices-open')

      click(matchEl)
      testEl.should.not.have.class('choose-choices-open')

      disabled.set(false)
      testEl.should.not.have.attribute('aria-disabled')

      click(matchEl)
      testEl.should.have.class('choose-choices-open')
    })

    !m && it('should not allow the selection to change when it is disabled', function() {
      var disabled = mobx.observable(true)
      selected.set('blue')
      testSetup({
        choices: colors,
        selected: selected,
        disabled: disabled
      })

      click('li:nth-child(3)')
      selected.get().should.equal('blue')
    })

    it('should mark items from disabledItems as aria-disabled', function() {
      var disabledItems = mobx.observable([])
      testSetup({
        choices: colors,
        selected: selected,
        disabledItems: disabledItems
      })

      testEl.should.have.not.attribute('aria-disabled', 'true')
      click(matchEl)

      attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null])

      disabledItems.push('brown')
      attributesFor('li', 'aria-disabled').should.deep.equal([null, 'true', null])
    })

    it('should not allow selection of disabled items', function() {
      var disabledItems = [dwane, people[0]]
      testSetup({
        choices: people,
        selected: selected,
        disabledItems: disabledItems
      })

      attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, 'true', null, null])

      click('li:nth-child(4)')
      if (multiple) {
        selected.slice().should.be.empty
      } else {
         chai.expect(selected.get()).to.equal(undefined)
      }

      click('li:nth-child(2)')
      if (multiple) {
        selected.slice().should.deep.equal([jane])
      } else {
        selected.get().should.equal(jane)
      }

      click('li:first-child')
      if (multiple) {
        selected.slice().should.deep.equal([jane])
      } else {
        selected.get().should.equal(jane)
      }
    })

    m && describe('max', function() {
      it('should disable unselected items when the maxiumum is reached', function() {
        testSetup({
          choices: people,
          selected: selected,
          max: mobx.observable(3)
        })

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])

        click('li:nth-child(4)')
        click('li:first-child')
        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])

        click('li:nth-child(2)')
        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, 'true', null, 'true', 'true'])
      })

      it('should disable unselected items initially if at or over the maxiumum', function() {
        selected = mobx.observable([dwane, jane, people[0], people[4]])
        testSetup({
          choices: people,
          selected: selected,
          max: 3
        })

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, 'true', null, null, 'true'])

        selected.replace([dwane, jane, people[4]])
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, null, 'true'])
      })

      it('should re-enable items after an item is deselected', function() {
        selected = mobx.observable([dwane, jane])
        testSetup({
          choices: people,
          selected: selected,
          max: 2
        })

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, 'true', 'true'])
        click('li:nth-child(2)')

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])
      })

      it('should re-enable items if the maxiumum changes when it is an observable', function() {
        selected = mobx.observable([dwane, jane])
        var max = mobx.observable(2)
        testSetup({
          choices: people,
          selected: selected,
          max: max
        })

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, 'true', 'true'])

        max.set(4)

        attributesFor('li', 'aria-disabled').should.deep.equal([null, null, null, null, null, null])
      })

      it('should work in tandem with disabled items', function() {
        selected = mobx.observable([dwane, jane])
        var disabledItems = mobx.observable([dwane, people[0]])
        testSetup({
          choices: people,
          selected: selected,
          disabledItems: disabledItems,
          max: 3
        })

        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, 'true', null, null])

        click('li:nth-child(5)')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', 'true', null, 'true'])

        click('li:first-child')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', 'true', null, 'true'])

        disabledItems.replace([people[0]])
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, 'true', null, null, 'true'])

        click('li:nth-child(2)')
        attributesFor('li', 'aria-disabled').should.deep.equal(['true', null, null, null, null, null])
      })
    })
  })
  })

  function groupedColorsTest() {
    testSetup({
      choices: {
        pastels: ['pink', 'mauve', 'baby blue'],
        earth: ['copper', 'brown', 'citron'],
        vibrant: ['cyan']
      },
      selected: selected,
      showSearch: true
    })
  }

  function groupedPeopleTest() {
    selected = mobx.observable([])
    testSetup({
      choices: {
        managers: [{
          name: 'Tom',
          age: 25,
          eyeColor: 'brown'
        }, {
          name: 'Tori',
          age: 27,
          eyeColor: 'blue'
        }],
        employees: [dwane, jane],
      },
      selected: selected,
      showSearch: true,
      searchProps: ['name', 'eyeColor'],
      multiple: true,
      Match: function(props) {
        return e('span', null, props.selected && props.selected.name)
      },
      Option: function(props) {
        return e('span', null, props.option.name.toLowerCase())
      },
      GroupHeader: function(props) {
        return e('h3', null, props.name)
      }
    })
  }

  describe('groups', function() {
    it('should render an object of scalar arrays as groups with default templates', function() {
      groupedColorsTest()

      textNodesFor('.choose-choices > ul.choose-group > li span.choose-group-header')
        .should.deep.equal(['pastels', 'earth', 'vibrant'])
      textNodesFor('.choose-choices > ul.choose-group > li:first-child ul.choose-items span')
        .should.deep.equal(['pink', 'mauve', 'baby blue'])
      textNodesFor('.choose-choices > ul.choose-group > li:nth-child(2) ul.choose-items span')
        .should.deep.equal(['copper', 'brown', 'citron'])
      textNodesFor('.choose-choices > ul.choose-group > li:last-child ul.choose-items span')
        .should.deep.equal(['cyan'])
    })

    it('should should single select a sub item', function() {
      groupedColorsTest()

      click('.choose-choices li:first-child ul.choose-items li:nth-child(2)')
      selected.get().should.equal('mauve')
      testEl.querySelector('.choose-match span').textContent.should.equal('mauve')

      click('.choose-choices li:nth-child(2) ul.choose-items li:last-child')
      selected.get().should.equal('citron')
      testEl.querySelector('.choose-match span').textContent.should.equal('citron')
    })

    it('should do nothing when clicking a group header', function() {
      groupedColorsTest()

      click(matchEl)
      click('.choose-choices > ul > li:first-child .choose-group-header')
      should.not.exist(selected.get())
      testEl.should.have.class('choose-choices-open')
    })

    it('should render an object of object arrays as groups given templates', function() {
      groupedPeopleTest()

      textNodesFor('.choose-choices > ul > li h3')
        .should.deep.equal(['managers', 'employees'])
      textNodesFor('.choose-choices li:first-child ul.choose-items span')
        .should.deep.equal(['tom', 'tori'])
      textNodesFor('.choose-choices li:last-child ul.choose-items span')
        .should.deep.equal(['dwane', 'jane'])
    })

    it('should select multiple items from different groups', function() {
      groupedPeopleTest()

      click('.choose-choices li:first-child ul.choose-items li:nth-child(2)')
      selected[0].name.should.equal('Tori')

      click('.choose-choices li:nth-child(2) ul.choose-items li:last-child')
      selected.map(function(i) { return i.name }).should.deep.equal(['Tori', 'Jane'])
    })
  })

  describe('search', function() {
    var searchbox, searchWrapper,
    searchTestSetup = function() {
      testSetup.apply(null, arguments)
      searchWrapper = testEl.querySelector('.choose-search-wrapper')
      searchbox = testEl.querySelector('.choose-search-wrapper input')
    }

    it('by default should only show when there are more than 10 items', function() {
      searchTestSetup({ choices: colors, selected: selected })
      searchWrapper.style.display.should.equal('none')

      colors.replace(colors.concat(['pink', 'red', 'blue', 'crimson', 'rebeccapurple', 'iris', 'seagreen', 'pumpkin']))
      searchWrapper.style.display.should.equal('')
    })

    it('by default should only show when there are more than 10 items in all groups', function() {
      var choices = mobx.observable({
        one: ['a', 'b', 'c'],
        two: ['n', 'm', 'o']
      })
      searchTestSetup({
        choices: choices,
        selected: selected
      })
      searchWrapper.style.display.should.equal('none')

      choices.one = ['a', 'b', 'c', 'd', 'e', 'f']
      choices.two = ['n', 'm', 'o', 'p', 'q', 'r']
      searchWrapper.style.display.should.equal('')
      searchbox.should.have.attribute('type', 'search')
    })

    it('should allow showSearch to be an observable', function() {
      var showSearch = mobx.observable('yup')
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: showSearch
      })
      searchWrapper.style.display.should.equal('')

      showSearch.set(false)
      searchWrapper.style.display.should.equal('none')
    })

    it('should call the showSearch function if provided to determine weather to show the searchbox', function() {
      var showSearch = sinon.spy(function() {
        return colors.length > 5
      })
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: showSearch
      })
      showSearch.should.have.been.calledOnce
      searchWrapper.style.display.should.equal('none')

      colors.replace(colors.concat(['pink', 'red', 'blue']))
      showSearch.should.have.been.calledTwice
      searchWrapper.style.display.should.equal('')
    })

    it('should filter scalar items to choose from as the user types', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup({ choices: colors, selected: selected })
      click(matchEl)
      type(searchbox, 'b')
      clock.tick(5)

      textNodesFor('.choose-choices li').should.deep.equal(['blue', 'brown'])
    })

    it('should filter object items by searching properties defined in searchProps', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup({
        choices: people,
        selected: selected,
        searchProps: ['name'],
        Option: nameAndAge
      })

      click(matchEl)
      type(searchbox, 'an')
      clock.tick(5)

      textNodesFor('.choose-choices li').should.deep.equal(['Jane - 25', 'Anne - 37', 'Dwane - 21'])

      type(searchbox, '2')
      clock.tick(5)

      textNodesFor('.choose-choices li').should.be.empty
    })

    it('should fiter scalar items in groups by the search term, excluding groups without matches', function() {
      clock = sinon.useFakeTimers()
      groupedColorsTest()
      type(testEl.querySelector('.choose-search-wrapper input'), 'r')
      clock.tick(5)

      textNodesFor('.choose-choices > ul.choose-group > li span.choose-group-header')
        .should.deep.equal(['earth'])
      textNodesFor('.choose-choices > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['copper', 'brown', 'citron'])

      type(testEl.querySelector('.choose-search-wrapper input'), 'v')
      clock.tick(5)

      textNodesFor('.choose-choices > ul > li span.choose-group-header')
        .should.deep.equal(['pastels'])
      textNodesFor('.choose-choices > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['mauve'])
    })

    it('should fiter object items in groups by the search term, excluding groups without matches', function() {
      clock = sinon.useFakeTimers()
      groupedPeopleTest()

      type(testEl.querySelector('.choose-search-wrapper input'), 'blue')
      clock.tick(5)

      textNodesFor('.choose-choices > ul.choose-group > li h3')
        .should.deep.equal(['managers', 'employees'])
      textNodesFor('.choose-choices > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['tori'])
      textNodesFor('.choose-choices > ul > li:nth-child(2) ul.choose-items span')
        .should.deep.equal(['jane'])

      type(testEl.querySelector('.choose-search-wrapper input'), 'To')
      clock.tick(5)

      textNodesFor('.choose-choices > ul > li h3')
        .should.deep.equal(['managers'])
      textNodesFor('.choose-choices > ul > li:first-child ul.choose-items span')
        .should.deep.equal(['tom', 'tori'])
    })

    it('should focus the first item in the list when arrow down is pressed', function() {
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: true
      })

      searchbox.focus()
      keydown(searchbox, 38).defaultPrevented.should.be.true

      document.activeElement.should.have.text('red')
    })

    it('should focus the searchbox when the choose element is focused', !window.callPhantom && function(done) {
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: true
      })

      click(matchEl)
      testEl.focus()
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 100)
    })

    it('should close the dropdown when focus is lost from the searchbox', function() {
      clock = sinon.useFakeTimers()
      searchTestSetup({ choices: colors, selected: selected, showSearch: true })

      click(matchEl)
      searchbox.focus()
      testEl.should.have.class('choose-choices-open')

      blur(searchbox)
      clock.tick(30)
      testEl.should.not.have.class('choose-choices-open')
    })

    it('should focus the last item in the list when arrow up is pressed', function() {
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: true
      })

      searchbox.focus()
      keydown(searchbox, 40).defaultPrevented.should.be.true

      document.activeElement.should.have.text('blue')
    })

    it('should focus the searchbox when arrow up is pressed on the top item', !window.callPhantom && function(done) {
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: true
      })

      var firstItem = testEl.querySelector('li:first-child')
      firstItem.focus()
      keydown(firstItem, 38).defaultPrevented.should.be.true
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 150)
    })

    it('should focus the searchbox when arrow down is pressed on the last item', !window.callPhantom && function(done) {
      searchTestSetup({
        choices: colors,
        selected: selected,
        showSearch: true
      })

      var lastItem = testEl.querySelector('li:last-child')
      lastItem.focus()
      keydown(lastItem, 40).defaultPrevented.should.be.true
      setTimeout(function() {
        document.activeElement.should.equal(searchbox)
        done()
      }, 150)
    })
  })
})