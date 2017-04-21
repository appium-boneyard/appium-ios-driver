/* globals $ */

(function () {

  $._elementOrElementsByType = function (targetElement, opts) {
     if (!targetElement || targetElement.isNil()) {
      throw new Error("Target element must exist");
    }

    return targetElement._elementOrElementsByType(opts);
  };

  UIAElement.prototype._elementOrElementsByType = function (opts) {
    var typeArray   = opts.typeArray,
        onlyFirst   = opts.onlyFirst,
        onlyVisible = opts.onlyVisible,
        nameObject  = opts.name,
        labelObject = opts.label,
        valueObject = opts.value;

    if (!typeArray) throw new Error("Must provide typeArray when calling _elementOrElementsByType");

    var numTypes = typeArray.length;

    // allow '*' to match on all types.
    var allTypes = false;
    if (numTypes === 1 && typeArray[0] === '*') allTypes = true;

    onlyFirst = onlyFirst === true;
    onlyVisible = onlyVisible !== false;

    var validateObject = function (objectName, object) {
      if (object && (typeof object.substring   === "undefined" ||
                     typeof object.target      === "undefined" ||
                     typeof object.insensitive === "undefined")) {
        throw new Error(objectName + " object must contain substring, target, and insensitive");
      }
    };

    validateObject("name", nameObject);
    validateObject("label", labelObject);
    validateObject("value", valueObject);

    var target = $.target();
    target.pushTimeout(0);

    var attributeMatch = function (elementProperty, attributeObject) {
      if (!elementProperty || !attributeObject) return false;

      var target = attributeObject.target;
      if (!target) return false;
      if (attributeObject.insensitive) {
        elementProperty = elementProperty.toLowerCase();
        target = target.toLowerCase();
      }
      if (attributeObject.substring) {
        return elementProperty.indexOf(target) !== -1;
      } else {
        return elementProperty === target;
      }
    };

    var getTree = function (element) {
      var elems = [];
      // element.elements() may return nil children.
      if (element.isNil()) {
        return elems;
      }
      // process element
      var visible = element.isVisible() === 1;
      var elType = element.type();
      for (var i = 0; i < numTypes; i++) {
        if (allTypes || elType === typeArray[i]) {
          if (!onlyVisible || visible) {
            // if an object isn't provided then it's a match.
            var nameMatch  = nameObject  ? attributeMatch(element.name(),  nameObject)  : false;
            var labelMatch = labelObject ? attributeMatch(element.label(), labelObject) : false;
            var valueMatch = valueObject ? attributeMatch(element.value(), valueObject) : false;

            // If we're only searching for a type then skip attribute matching.
            if (!nameObject && !labelObject && !valueObject) nameMatch = true;

            if (element.checkIsValid() && (nameMatch || labelMatch || valueMatch)) {
              elems.push(element);
            }

            if (onlyFirst && elems.length === 1) return elems;
            break;
          }
        }
      }

      if (element.hasChildren()) {
        var children = element.elements();
        var numChildren = children.length;
        for (i = 0; i < numChildren; i++) {
          if (onlyFirst && elems.length === 1) return elems;
          elems = elems.concat(getTree(children[i]));
        }
      }

      return elems;
    };

    var foundElements = getTree(this);
    target.popTimeout();

    return $.smartWrap(foundElements).dedup();
  };

  UIAElement.prototype.getFirstWithPredicateWeighted = function (predicate) {
    var weighting = [
      'secureTextFields'
    , 'textFields'
    , 'buttons'
    , 'elements'
    ];
    var elems = this._elementOrElementsWithPredicateWeighted(predicate,
                  weighting, true);
    return $.smartWrap(elems).dedup()[0];
  };

  UIAElement.prototype.getFirstWithPredicate = function (predicate, onlyVisible) {
    var weighting = ['elements'];
    var elems = this._elementOrElementsWithPredicateWeighted(
                  predicate, weighting, true, onlyVisible);
    return $.smartWrap(elems).dedup()[0];
  };

  UIAElement.prototype.getAllWithPredicate = function (predicate, onlyVisible) {
    var weighting = ['elements'];
    var elems = this._elementOrElementsWithPredicateWeighted(predicate, weighting, false, onlyVisible);
    return $.smartWrap(elems).dedup();
  };

  UIAElement.prototype._elementOrElementsWithPredicateWeighted = function (predicate, weighting, onlyFirst, onlyVisible) {
    weighting = weighting || ['elements'];
    onlyFirst = (onlyFirst === true);
    onlyVisible = onlyVisible !== false;

    UIATarget.localTarget().pushTimeout(0);

    var results = [];
    var element = this;
    var found, prop;
    for (var i = 0; i < weighting.length; i++) {
      prop = weighting[i];
      if (typeof element[prop] === 'function') {
        found = element[prop]();
        if (predicate) found = found.withPredicate(predicate);
        if (onlyVisible) found = found.withValueForKey(true, 'isVisible');
      } else {
        throw new Error("Invalid function '" + prop + "'");
      }

      if (found.isValid()) {
        results = results.concat(found.toArray());
      }

      // If we don't find anything or if we aren't just trying to find the first
      // match, keep looking. Otherwise exit the loop.
      if (onlyFirst && results.length > 0) break;
    }

    // Only look through children if we have to.
    if (!onlyFirst || results.length === 0) {
      var child;
      var children = this.elements();
      for (var a = 0; a < children.length; a++) {
        child = children[a];
        // make sure child isn't nil and isn't a webview
        // (we don't care about them for native and they tend to have tons
        // of children which make performance bad)
        if (!child.isNil() && child.type() !== "UIAWebView") {
          results = results.concat(child
                      ._elementOrElementsWithPredicateWeighted(predicate,
                        weighting, onlyFirst, onlyVisible));
        }
      }
    }

    UIATarget.localTarget().popTimeout();

    return results;
  };

  var _formatPredicate = function (targetName, contains) {
    targetName = targetName || "";

    if (typeof targetName !== 'string') {
      throw new Error("You must supply a string for an element predicate search.");
    }

    // escape unescaped single and double quotation marks and return a predicate condition
    // string in the format 'name VERB "TARGET" || label VERB "TARGET"'.
    var verb = contains ? 'contains[c]' : '==';
    var comparison = verb + ' "' + targetName.replace(/\\?['"]/g, "\\$&") + '"';

    return 'name ' + comparison + ' || label ' + comparison;
  };

  UIAElement.prototype.getWithName = function (targetName, onlyVisible) {
    return this.getFirstWithPredicate(_formatPredicate(targetName, false), onlyVisible);
  };

  UIAElement.prototype.getAllWithName = function (targetName, onlyVisible) {
    return this.getAllWithPredicate(_formatPredicate(targetName, false), onlyVisible);
  };

  UIAElement.prototype.getNameContains = function (targetName, onlyVisible) {
    return this.getFirstWithPredicate(_formatPredicate(targetName, true), onlyVisible);
  };

  UIAElement.prototype.getAllNameContains = function (targetName, onlyVisible) {
    return this.getAllWithPredicate(_formatPredicate(targetName, true), onlyVisible);
  };

  UIAElement.prototype.getWithNameAndTap = function (targetName, onlyVisible) {
    var el = this.getWithName(targetName, onlyVisible);
     if (!el || el.isNil()) {
      throw new Error("Could not find the element to tap");
    }
    el.tap();
    return el;
  };

})();
