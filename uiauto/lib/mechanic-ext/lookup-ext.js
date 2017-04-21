/* globals ERROR, $ */

(function () {
  $.extend($, {

    // Element lookup functions

    lookup: function (selector, ctx) {
      if (typeof selector !== 'string') {
        return null;
      }

      var _ctx = $.mainApp()
        , elems = [];

      if (typeof ctx === 'string') {
        _ctx = this.cache[ctx];
      } else if (typeof ctx !== 'undefined') {
        _ctx = ctx;
      }

      $.target().pushTimeout(0);
      if (selector === 'alert') {
        var alert = $.mainApp().alert();
        if (alert) {
          elems = $(alert);
        }
      } else {
        elems = $(selector, _ctx);
      }
      $.target().popTimeout();

      return elems;
    }

  , getElement: function (name) {
      if (typeof this.cache[name] !== 'undefined') {
        if (this.cache[name].isNil()) {
          throw new Error.StaleElementReference();
        }
        return this.cache[name];
      }
      return null;
    }

  , getId: function (el) {
      var id = (this.identifier++).toString();
      if (el.name() !== null) {
        $.debug('Lookup returned ' + el + ' with the name "' + el.name() + '" (id: ' + id + ').');
      }
      this.cache[id] = el;
      return id;
    }

  , getElementByName: function (name, ctx) {
      if (name.match(/\*.*\*/)) {
        return this._defaultContext(ctx).getNameContains(
          name.replace(/^\*|\*$/g, ''), false);
      } else {
        return this._defaultContext(ctx).getWithName(name, false);
      }
    }

  , getElementsByName: function (name, ctx) {
      if (name.match(/^\*.*\*$/)) {
        return this._defaultContext(ctx).getAllNameContains(
          name.replace(/^\*|\*$/g, ''), false);
      } else {
        return this._defaultContext(ctx).getAllWithName(name, false);
      }
    }

  , getElementByAccessibilityId: function (accessibilityId, ctx) {
      return this._defaultContext(ctx).getWithName(accessibilityId, false);
    }

  , getElementsByAccessibilityId: function (accessibilityId, ctx) {
      return this._defaultContext(ctx).getAllWithName(accessibilityId, false);
    }

  , _getIdSearchPredicate: function (sel, exact) {
      if (exact) {
        return "name == '" + sel + "' || label == '" + sel + "' || value == '" +
          sel + "'";
      } else {
        // Note that we don't want to include 'value' in this search. Even
        // though the documentation says the 'value' function on UIAElement
        // returns a string, on the backend it can sometimes be a number
        // (e.g. 0 or 1 for a switch). If this happens, UIAutomation will
        // throw an exception since predicate keywords like CONTAINS and LIKE can
        // only be performed on a collection/string.
        return "name contains[c] '" + sel + "' || label contains[c] '" + sel + "'";
      }
    }

  , getElementById: function (sel) {
      var exactPred = this._getIdSearchPredicate(sel, true);
      var exact = $.mainApp().getFirstWithPredicateWeighted(exactPred);
      if (exact) {
        return exact;
      } else {
        var pred = this._getIdSearchPredicate(sel, false);
        return $.mainApp().getFirstWithPredicateWeighted(pred);
      }
    }

  , getElementsById: function (sel) {
      var pred = this._getIdSearchPredicate(sel, false);
      return $.mainApp().getAllWithPredicate(pred);
    }

  , _getElementsByType: function (type, ctx) {
      var selector = this.convertSelector(type);
      var elems = this.lookup(selector, ctx);
      return $.smartWrap(elems);
    }

  , getElementsByType: function (type, ctx) {
      var elems = this._getElementsByType(type, ctx);
      return $.smartWrap(elems).dedup();
    }

  , getElementByType: function (type, ctx) {
      var elems = this._getElementsByType(type, ctx);
      return $.smartWrap(elems).dedup()[0];
    }

  , getActiveElement: function () {
      return $($.mainWindow()).getActiveElement();
    }

  , getElementByUIAutomation: function (selectorCode, ctx) {
      var elems = this._getElementsByUIAutomation(selectorCode, ctx);
      return $.smartWrap(elems).dedup()[0];
    }
  , getElementsByUIAutomation: function (selectorCode, ctx) {
      var elems = this._getElementsByUIAutomation(selectorCode, ctx);
      elems = $.smartWrap(elems);
      return $.smartWrap(elems).dedup();
    }
  , _getElementsByUIAutomation: function (selectorCode, ctx) {
      if (!selectorCode) throw new Error('No code provided.');

      var code;
      if (selectorCode[0] !== '.') {
        code = selectorCode;
      } else if (ctx === null || typeof ctx === 'undefined') {
        code = '$.mainWindow()' + selectorCode;
      } else if (typeof ctx === 'string') {
        code = '$.getElement(\'' + ctx + '\')' + selectorCode;
      } else {
        code = 'ctx' + selectorCode;
      }

      $.debug('byUIAutomation: evaluating code: ' + code);
      /* jshint evil: true */
      var elems = eval(code);
      return $.smartWrap(elems);
    }
  });

  $.extend($.fn, {
    getActiveElement: function () {
        var foundElement = null;
        var checkAll = function (element) {
          var children = $(element).children();
          children.each(function (e, child) {
            var focused = $(child).isFocused();
            if (focused === true || focused === 1) {
              return child;
            }
            if (child.hasChildren()) { // big optimization
              checkAll(child);
            }
          });

          return null;
        };
        // try $.cache in the array first
        for (var key in $.cache) {
          var elemFocused = $($.cache[key]).isFocused();
          if (elemFocused === true || elemFocused === 1) {
            return $.cache[key];
          }
        }
        foundElement = checkAll(this);

        if (foundElement) {
          return foundElement;
        } else {
          throw new ERROR.NoSuchElement();
        }
      }
  });

})();
