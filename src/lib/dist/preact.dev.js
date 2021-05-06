"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createElement = createElement;
exports.render = render;

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function createElement(type, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return {
    type: type,
    props: _objectSpread({}, props, {
      children: children.map(function (child) {
        return _typeof(child) === 'object' ? child : createTextElement(child);
      })
    })
  };
}

function createDom(fiber) {
  var dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
  Object.keys(fiber.props).filter(function (key) {
    return key !== 'children';
  }).forEach(function (name) {
    return dom[name] = fiber.props[name];
  });
  return dom;
}

function workLoop(deadline) {
  var shouldYeild = false;

  while (nextUnitOfWork && !shouldYeild) {
    nextUnitOfWork = performUnitWork(nextUnitOfWork);
    shouldYeild = deadline.timeRemaining() > 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

function updateDom(dom, preProps, nextProps) {
  // remove old event listener;
  Object.keys(preProps).filter(function (key) {
    return key.startsWith("on") && preProps[key] !== nextProps[key];
  }).forEach(function (name) {
    dom.removeEventListener(name.toLowerCase().substring(2), preProps[name]);
  }); //remove old props

  Object.keys(preProps).filter(function (key) {
    return key !== "children" && !(key in nextProps);
  }).forEach(function (name) {
    return dom[name] = '';
  }); // add new event listener

  Object.keys(nextProps).filter(function (key) {
    return key.startsWith(on) && preProps[key] !== nextProps[key];
  }).forEach(function (name) {
    return dom.addEventListener(name.toLocaleLowerCase().substring(2), nextProps[name]);
  }); // add or update props

  Object.keys(nextProps).filter(function (key) {
    return preProps[key] !== nextProps[key];
  }).forEach(function (name) {
    return dom[name] = nextProps[name];
  });
}

function commitWork(fiber) {
  if (!fiber) return;
  var parentDom = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    parentDom.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.slibing);
}

function commitRoot() {
  // TODO ADD root dom 
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function render(element, container) {
  //todo set next unit of work
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
}

var nextUnitOfWork = null;
var wipRoot = null;
var currentRoot = null;
var deletions = null;
requestIdleCallback(workLoop);
/**
 * 执行当前优先级任务片，并返回下次执行任务片
 * 
 * @param {下次待执行任务} nextUnitOfWork 
 */

function performUnitWork(fiber) {
  //创建fiber dom 节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  } // 将dom节点加入dom树


  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  } // 处理子节点，为子节点以及父节点创建fiber对象并将其作为下一个nextUnitOfWork 返回


  var elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }

  var nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.slibing) {
      return nextFiber.slibing;
    }

    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  var index = 0;
  var oldFiber = wipFiber.alternate && alternate.alternate.child;
  var preSlibing = null; // 创建children fiber节点

  while (index < elements.length || oldFiber !== null) {
    var element = elements[index]; // compare old fiber to element

    var newFiber = null; //  {
    //   type: element.type,
    //   parent: wipFiber,
    //   props: element.props,
    //   dom: null,
    // }

    var sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      //todo update the same node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      };
    }

    if (element && !sameType) {
      // Todo add new node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }

    if (oldFiber && !sameType) {
      //todo delete oldFiber
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = (_readOnlyError("oldFiber"), oldFiber.slibing);
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      preSlibing.slibing = newFiber;
    }

    preSlibing = newFiber;
    index++;
  }
}