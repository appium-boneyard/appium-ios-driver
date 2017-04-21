/*
 * mechanic.js UIAutomation Library
 * http://cozykozy.com/pages/mechanicjs
 *
 * Copyright (c) 2012 Jason Kozemczak
 * mechanic.js may be freely distributed under the MIT license.
 *
 * Includes parts of Zepto.js
 * Copyright 2010-2012, Thomas Fuchs
 * Zepto.js may be freely distributed under the MIT license.
 */

var mechanic = (function() {
    // Save a reference to the local target for convenience
    var target = UIATarget.localTarget();

    // Set the default timeout value to 0 to avoid making walking the object tree incredibly slow.
    // Developers can adjust this value by calling $.timeout(duration)
    target.setTimeout(0);

    // This property is meant to suppress excessive logging which prevents instruments from promptly dumping out screenshots.
    this.isVerbose = false

    var app = target.frontMostApp(),
        window = app.mainWindow(),
        emptyArray = [],
        slice = emptyArray.slice

    // Setup a map of UIAElement types to their "shortcut" selectors.
    var typeShortcuts = {
        'UIAActionSheet' : ['actionsheet'],
        'UIAActivityIndicator' : ['activityIndicator'],
        'UIAAlert' : ['alert'],
        'UIAButton' : ['button'],
        'UIACollectionCell' : ['collectionCell'],
        'UIACollectionView' : ['collection'],
        'UIAEditingMenu': ['editingMenu'],
        'UIAElement' : ['\\*'], // TODO: sort of a hack
        'UIAImage' : ['image'],
        'UIAKey' : ['key'],
        'UIAKeyboard' : ['keyboard'],
        'UIALink' : ['link'],
        'UIAMapView': ['mapView'],
        'UIAPageIndicator' : ['pageIndicator'],
        'UIAPicker' : ['picker'],
        'UIAPickerWheel' : ['pickerwheel'],
        'UIAPopover' : ['popover'],
        'UIAProgressIndicator' : ['progress'],
        'UIAScrollView' : ['scrollview'],
        'UIASearchBar' : ['searchbar'],
        'UIASecureTextField' : ['secure'],
        'UIASegmentedControl' : ['segmented'],
        'UIASlider' : ['slider'],
        'UIAStaticText' : ['text'],
        'UIAStatusBar' : ['statusbar'],
        'UIASwitch' : ['switch'],
        'UIATabBar' : ['tabbar'],
        'UIATableView' : ['tableview'],
        'UIATableCell' : ['cell', 'tableCell'],
        'UIATableGroup' : ['group'],
        'UIATextField' : ['textfield'],
        'UIATextView' : ['textview'],
        'UIAToolbar' : ['toolbar'],
        'UIAWebView' : ['webview'],
        'UIAWindow' : ['window'],
        'UIANavigationBar': ['navigationBar']
    };

    // Build a RegExp for picking out type selectors.
    var typeSelectorREString = (function() {
        var key;
        var typeSelectorREString = "\\";
        for (key in typeShortcuts) {
            // Instruments' javascript runtime (Xcode 5) automatically adds
            // extra keys which are not in the shortcut list above, skip them
            if (Array.isArray(typeShortcuts[key])) {
                typeSelectorREString += key + "|";
                typeShortcuts[key].forEach(function(shortcut) { typeSelectorREString += shortcut + "|"; });
            }
        }
        return typeSelectorREString.substr(1, typeSelectorREString.length - 2);
    })();

    var patternName = "[^,\\[\\]]+"

    var selectorPatterns = {
      simple:          (new RegExp("^#("+patternName+")$"))
     ,byType:          (new RegExp("^("+typeSelectorREString+")$"))
     ,byAttr:          (new RegExp("^\\[(\\w+)=("+patternName+")\\]$"))
     ,byTypeAndAttr:   (new RegExp("^("+typeSelectorREString+")\\[(\\w+)=("+patternName+")\\]$"))
     ,children:        (new RegExp("^(.*) > (.*)$"))
     ,descendents:     (new RegExp("^(.+) +(.+)$"))
    }

    var searches = {
      simple:          function(name)         { return this.getElementsByName(name)          }
     ,byType:          function(type)         { return this.getElementsByType(type)          }
     ,byAttr:          function(attr,value)   { return this.getElementsByAttr(attr,value)    }
     ,byTypeAndAttr:   function(type,a,v)     { return $(type, this).filter('['+a+'='+v+']') }
     ,children:        function(parent,child) { return $(parent, this).children().filter(child) }
     ,descendents:     function(parent,child) { return $(child, $(parent, this))             }
    }

    var filters = {
       simple:        function(name)      { return this.name() == name                       }
      ,byType:        function(type)      { return this.isType(type)                         }
      ,byAttr:        function(attr,value){ return this[attr] && this[attr]() == value       }
      ,byTypeAndAttr: function(type,a,v ) { return this.isType(type) && this[a]() == v  }
    }


    function Z(dom, selector){
        dom = dom || emptyArray;
        dom.__proto__ = Z.prototype;
        dom.selector = selector || '';
        if (dom === emptyArray) {
            UIALogger.logWarning("element " + selector + " have not been found");
        }
        return dom;
    }

    function $(selector, context) {
        if (!selector) return Z();
        if (context !== undefined) return $(context).find(selector);
        else if (selector instanceof Z) return selector;
        else {
            var dom;
            if (isA(selector)) dom = compact(selector);
            else if (selector instanceof UIAElement) dom = [selector];
            else dom = $$(app, selector);
            return Z(dom, selector);
        }
    }

    $.qsa = $$ = function(element, selector) {
        var ret = [],
            groups = selector.split(/ *, */),
            matches
        $.each(groups, function() {
          for (type in searches) {
            if (matches = this.match(selectorPatterns[type])) {
              matches.shift()
              ret = ret.concat($(searches[type].apply(element, matches)))
              break
            }
          }
        })
        return $(ret)
    };

    // Add functions to UIAElement to make object graph searching easier.
    UIAElement.prototype.getElementsByName = function(name) {
        return this.getElementsByAttr('name', name)
    };

    UIAElement.prototype.getElementsByAttr = function(attr, value) {
        return $.map(this.elements(), function(el) {
            var matches = el.getElementsByAttr(attr, value),
                val = el[attr]
            if (typeof val == 'function') val = val.apply(el)
            if (typeof val != 'undefined' && val == value)
              matches.unshift(el)
            return matches
        })
    }
    UIAElement.prototype.getElementsByType = function(type) {
        return $.map(this.elements(), function(el) {
            var matches = el.getElementsByType(type);
            if (el.isType(type)) matches.unshift(el);
            return matches;
        });
    };
    UIAElement.prototype.isType = function(type) {
        var thisType = this.toString().split(" ")[1];
        thisType = thisType.substr(0, thisType.length - 1);
        if (type === thisType) return true;
        else if (typeShortcuts[thisType] !== undefined && typeShortcuts[thisType].indexOf(type) >= 0) return true;
        else if (type === '*' || type === 'UIAElement') return true;
        else return false;
    };

    function isF(value) { return ({}).toString.call(value) == "[object Function]"; }
    function isO(value) { return value instanceof Object; }
    function isA(value) { return value instanceof Array; }
    function likeArray(obj) { return typeof obj.length == 'number'; }

    function compact(array) { return array.filter(function(item){ return item !== undefined && item !== null; }); }
    function flatten(array) { return array.length > 0 ? [].concat.apply([], array) : array; }

    function uniq(array) { return array.filter(function(item,index,array){ return array.indexOf(item) == index; }); }

    function filtered(elements, selector) {
        return selector === undefined ? $(elements) : $(elements).filter(selector);
    }

    $.extend = function(target){
        var key;
        slice.call(arguments, 1).forEach(function(source) {
            for (key in source) target[key] = source[key];
        });
        return target;
    };

    $.inArray = function(elem, array, i) {
        return emptyArray.indexOf.call(array, elem, i);
    };

    $.map = function(elements, callback) {
        var value, values = [], i, key;
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++) {
                value = callback(elements[i], i);
                if (value != null) values.push(value);
            }
        } else {
            for (key in elements) {
                value = callback(elements[key], key);
                if (value != null) values.push(value);
            }
        }
        return flatten(values);
    };

    $.each = function(elements, callback) {
        var i, key;
        if (likeArray(elements)) {
            for(i = 0; i < elements.length; i++) {
                if(callback.call(elements[i], i, elements[i]) === false) return elements;
            }
        } else {
            for(key in elements) {
                if(callback.call(elements[key], key, elements[key]) === false) return elements;
            }
        }
        return elements;
    };

    $.fn = {
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,
        map: function(fn){
            return $.map(this, function(el, i){ return fn.call(el, i, el); });
        },
        slice: function(){
            return $(slice.apply(this, arguments));
        },
        get: function(idx){ return idx === undefined ? slice.call(this) : this[idx]; },
        size: function(){ return this.length; },
        each: function(callback) {
            this.forEach(function(el, idx){ callback.call(el, idx, el); });
            return this;
        },
        filter: function(selector) {
          var matches
          for (type in filters) {
            if (matches = selector.match(selectorPatterns[type])) {
              matches.shift() // remove the original string, we only want the capture groups
              return $.map(this, function(e) {
                return filters[type].apply(e, matches) ? e : null
              })
            }
          }
        },
        end: function(){
            return this.prevObject || $();
        },
        andSelf:function(){
            return this.add(this.prevObject || $());
        },
        add:function(selector,context){
            return $(uniq(this.concat($(selector,context))));
        },
        is: function(selector){
            return this.length > 0 && $(this[0]).filter(selector).length > 0;
        },
        not: function(selector){
            var nodes=[];
            if (isF(selector) && selector.call !== undefined)
                this.each(function(idx){
                    if (!selector.call(this,idx)) nodes.push(this);
                });
            else {
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                        (likeArray(selector) && isF(selector.item)) ? slice.call(selector) : $(selector);
                this.forEach(function(el){
                    if (excludes.indexOf(el) < 0) nodes.push(el);
                });
            }
            return $(nodes);
        },
        eq: function(idx){
            return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1);
        },
        first: function(){ var el = this[0]; return el && !isO(el) ? el : $(el); },
        last: function(){ var el = this[this.length - 1]; return el && !isO(el) ? el : $(el); },
        find: function(selector) {
            var result;
            if (this.length == 1) result = $$(this[0], selector);
            else result = this.map(function(){ return $$(this, selector); });
            return $(result);
        },
        predicate: function(predicate) {
            return this.map(function(el, idx) {
                if (typeof predicate == 'string') return el.withPredicate(predicate);
                else return null;
            });
        },
        valueForKey: function(key, value) {
            var result = this.map(function(idx, el) {
                if (key in el && el[key]() == value) {
                    return el;
                }
                return null;
            });
            return $(result);
        },
        valueInKey: function(key, val) {
            var result = this.map(function(idx, el) {
                if (key in el) {
                    var elKey = el[key]();
                    if (elKey === null) {
                        return null;
                    }
                    // make this a case insensitive search
                    elKey = elKey.toString().toLowerCase();
                    val = val.toString().toLowerCase();

                    if (elKey.indexOf(val) !== -1) {
                        return el;
                    }
                }
                return null;
            });
            return $(result);
        },
        closest: function(selector, context) {
            var el = this[0], candidates = $$(context || app, selector);
            if (!candidates.length) el = null;
            while (el && candidates.indexOf(el) < 0)
                el = el !== context && el !== app && el.parent();
            return $(el);
        },
        ancestry: function(selector) {
            var ancestors = [], elements = this;
            while (elements.length > 0)
                elements = $.map(elements, function(node){
                    if ((node = node.parent()) && !node.isType('UIAApplication') && ancestors.indexOf(node) < 0) {
                        ancestors.push(node);
                        return node;
                    }
                });
            return filtered(ancestors, selector);
        },
        parent: function(selector) {
            return filtered(uniq(this.map(function() { return this.parent(); })), selector);
        },
        children: function(selector) {
            return filtered(this.map(function(){ return slice.call(this.elements()); }), selector);
        },
        siblings: function(selector) {
            return filtered(this.map(function(i, el) {
                return slice.call(el.parent().elements()).filter(function(child){ return child!==el; });
            }), selector);
        },
        next: function(selector) {
            return filtered(this.map(function() {
                var els = this.parent().elements().toArray();
                return els[els.indexOf(this) + 1];
            }), selector);
        },
        prev: function(selector) {
            return filtered(this.map(function() {
                var els = this.parent().elements().toArray();
                return els[els.indexOf(this) - 1];
            }), selector);
        },
        index: function(element) {
            return element ? this.indexOf($(element)[0]) : this.parent().elements().toArray().indexOf(this[0]);
        },
        pluck: function(property) {
            return this.map(function() {
                if (typeof this[property] == 'function') return this[property]();
                else return this[property];
            });
        }
    };

    'filter,add,not,eq,first,last,find,closest,parents,parent,children,siblings'.split(',').forEach(function(property) {
        var fn = $.fn[property];
        $.fn[property] = function() {
            var ret = fn.apply(this, arguments);
            ret.prevObject = this;
            return ret;
        };
    });

    Z.prototype = $.fn;
    return $;
})();

var $ = $ || mechanic;  // expose $ shortcut
//     mechanic.js
//     Copyright (c) 2012 Jason Kozemczak
//     mechanic.js may be freely distributed under the MIT license.

(function($) {
    $.extend($, {
        log: function(s, level) {
            level = level || 'message';
            if (level === 'error') $.error(s);
            else if (level === 'warn') $.warn(s);
            else if (typeof $.isVerbose !== "undefined" && $.isVerbose) {
                if (level === 'debug') $.debug(s);
                else $.message(s);
            }
        },
        error: function(s) { UIALogger.logError(s); },
        warn: function(s) { UIALogger.logWarning(s); },
        debug: function(s) { UIALogger.logDebug(s); },
        message: function(s) { UIALogger.logMessage(s); },
        capture: function(imageName, rect) {
            var target = UIATarget.localTarget();
            imageName = imageName || new Date().toString();
            if (rect) target.captureRectWithName(rect, imageName);
            else target.captureScreenWithName(imageName);
        }
    });

    $.extend($.fn, {
        log: function() { return this.each(function() { this.logElement(); }); },
        logTree: function () { return this.each(function() { this.logElementTree(); }); },
        capture: function(imageName) {
            imageName = imageName || new Date().toString();
            return this.each(function() { $.capture(imageName + '-' + this.name(), this.rect()); });
        }
    });
})(mechanic);
//     mechanic.js
//     Copyright (c) 2012 Jason Kozemczak
//     mechanic.js may be freely distributed under the MIT license.

(function($) {
    var app = UIATarget.localTarget().frontMostApp();
    $.extend($.fn, {
        name: function() { return (this.length > 0) ? this[0].name() : null; },
        label: function() { return (this.length > 0) ? this[0].label() : null; },
        value: function() { return (this.length > 0) ? this[0].value() : null; },
        isFocused: function() { return (this.length > 0) ? this[0].hasKeyboardFocus() : false; },
        isEnabled: function() { return (this.length > 0) ? this[0].isEnabled() : false; },
        isVisible: function() { return (this.length > 0) ? this[0].isVisible() : false; },
        isValid: function(certain) {
            if (this.length != 1) return false;
            else if (certain) return this[0].checkIsValid();
            else return this[0].isValid();
        }
    });

    $.extend($, {
        version: function() {
            return app.version();
        },
        bundleID: function()  {
            return app.bundleID();
        },
        prefs: function(prefsOrKey) {
            // TODO: should we handle no-arg version that returns all prefs???
            if (typeof prefsOrKey == 'string') return app.preferencesValueForKey(prefsOrKey);
            else {
                $.each(prefsOrKey, function(key, val) {
                    app.setPreferencesValueForKey(val, key);
                });
            }
        }
    });

})(mechanic);
//     mechanic.js
//     Copyright (c) 2012 Jason Kozemczak
//     mechanic.js may be freely distributed under the MIT license.

(function($) {
    var target = UIATarget.localTarget();
    $.extend($, {
        timeout: function(duration) { target.setTimeout(duration); },
        delay: function(seconds) { target.delay(seconds); },
        cmd: function(path, args, timeout) { target.host().performTaskWithPathArgumentsTimeout(path, args, timeout); },
        orientation: function(orientation) {
            if (orientation === undefined || orientation === null) return target.deviceOrientation();
            else target.setDeviceOrientation(orientation);
        },
        location: function(coordinates, options) {
            options = options || {};
            target.setLocationWithOptions(coordinates, options);
        },
        shake: function() { target.shake(); },
        rotate: function(options) { target.rotateWithOptions(options); },
        pinchScreen: function(options) {
            if (!options.style) options.style = 'open';
            if (options.style === 'close') target.pinchCloseFromToForDuration(options.from, options.to, options.duration);
            else target.pinchOpenFromToForDuration(options.from, options.to, options.duration);
        },
        drag: function(options) { target.dragFromToForDuration(options.from, options.to, options.duration); },
        flick: function(options) { target.flickFromTo(options.from, options.to); },
        lock: function(duration) { target.lockForDuration(duration); },
        backgroundApp: function(duration) { target.deactivateAppForDuration(duration); },
        volume: function(direction, duration) {
            if (direction === 'up') {
                if (duration) target.holdVolumeUp(duration);
                else target.clickVolumeUp();
            } else {
                if (duration) target.holdVolumeDown(duration);
                else target.clickVolumeDown();
            }
        },
        input: function(s) {
            $.keyboard().typeString(s);
        }
    });

    $.extend($.fn, {
        tap: function(options) {
            options = options || {};
            return this.each(function() {
                // TODO: tapWithOptions supports most of the behavior of doubleTap/twoFingerTap looking at the API, do we need to support these methods??
                if (options.style === 'double') this.doubleTap();
                else if (options.style === 'twoFinger') this.twoFingerTap();
                else this.tapWithOptions(options);
            });
        },
        touch: function(duration) {
            return this.each(function() { this.touchAndHold(duration); });
        },
        dragInside: function(options) {
            return this.each(function() { this.dragInsideWithOptions(options); });
        },
        flick: function(options) {
            return this.each(function() { this.flickInsideWithOptions(options); });
        },
        rotate: function(options) {
            return this.each(function() { this.rotateWithOptions(options); });
        },
        scrollToVisible: function() {
            if (this.length > 0) this[0].scrollToVisible();
            return this;
        },
        input: function(s) {
            if (this.length > 0) {
                this[0].tap();
                $.input(s);
            }
        }
    });

    'delay,cmd,orientation,location,shake,pinchScreen,drag,lock,backgroundApp,volume'.split(',').forEach(function(property) {
        var fn = $[property];
        $.fn[property] = function() {
            fn.apply($, arguments);
            return this;
        };
    });
})(mechanic);
