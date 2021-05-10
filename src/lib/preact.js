function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        return typeof child === 'object' ?
          child : createTextElement(child)
      })
    }
  }
}

function createDom(fiber) {
  console.log('createDom:', fiber.type)
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') :
    document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);
  return dom;
}

function workLoop(deadline) {
  let shouldYeild = false;

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
  Object.keys(preProps)
    .filter(key => key.startsWith("on") && preProps[key] !== nextProps[key])
    .forEach(name => {
      dom.removeEventListener(name.toLowerCase().substring(2), preProps[name])
    })

  //remove old props
  Object.keys(preProps)
    .filter(key => key !== "children" && !(key in nextProps))
    .forEach(name => dom[name] = '');

  // add new event listener
  Object.keys(nextProps)
    .filter(key => key.startsWith('on') && preProps[key] !== nextProps[key])
    .forEach(name => dom.addEventListener(name.toLocaleLowerCase().substring(2), nextProps[name]))

  // add or update props
  Object.keys(nextProps)
    .filter(key => preProps[key] !== nextProps[key] && key !== 'children')
    .forEach(name => dom[name] = nextProps[name]);

}

function commitWork(fiber) {
  if (!fiber) return;
  console.log('commitwork:', fiber)

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const parentDom = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    parentDom.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.slibing);
}

function commitRoot() {
  // TODO ADD root dom 
  deletions.forEach(commitWork)
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

export function render(element, container) {
  //todo set next unit of work
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  nextUnitOfWork = wipRoot;
  deletions = [];
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;

requestIdleCallback(workLoop);


/**
 * 执行当前优先级任务片，并返回下次执行任务片
 * 
 * @param {下次待执行任务} nextUnitOfWork 
 */
function performUnitWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.slibing) {
      return nextFiber.slibing;
    }
    nextFiber = nextFiber.parent;
  }
}


function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}


function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let preSlibing = null;
  
  // 创建children fiber节点
  while (index < elements.length || oldFiber) {
    const element = elements[index];

    // compare old fiber to element
    const newFiber = null;
  
    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      //todo update the same node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
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
      }
    }

    if (oldFiber && !sameType) {
      //todo delete oldFiber
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    console.log('performUnitWork:', preSlibing, newFiber,element)

    if (oldFiber) {
      oldFiber = oldFiber.slibing;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if(element){
      preSlibing.slibing = newFiber;
    }
    preSlibing = newFiber;
    index++;
  }
}

let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children)
}


export function useState(initState) {
  const oldHook = wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initState,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action instanceof Function ? action(hook.state) : action;
  })

  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState]
}