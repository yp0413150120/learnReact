function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(item => typeof item === 'object' ? item : createTextElement(item))
    }
  }
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

const isProperty = (key) => key !== 'children';
const isGone = (preProps, nextProps) => {
  return (key) => (key in preProps) && !(key in nextProps)
}
const isNew = (preProps, nextProps) => {
  return (key) => nextProps[key] !== preProps[key]
}
const isEvent = (name) => name.startWith('on');


function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT'
  ? document.createTextNode('')
  : document.createElement(fiber.type);
  
  const isProperty = (key) => key !== 'children';
  
  Object.keys(fiber.props).filter(isProperty).forEach(key => {
    dom[key] = fiber.props[key]
  })
  return dom;
}

// 删除dom
function commitDeletion(fiber, domParent) {
  if (!fiber) return;
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

// function commitUpate(fiber) {
//   if (!fiber) return;
//   if (!fiber.dom) {
//     commitUpate(fiber.child);
//     return;
//   }
//   updateDom(fiber.dom, fiber.alternate.props, fiber.props);
// }

// 更新dom
function updateDom(dom, prevProps, nextProps) {
  // 旧属性移除，对于事件需要特殊处理
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(key => dom.removeEventListener(key.toLocaleLowerCase().slice(2), prevProps[key]));
  Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(key => {
    dom[key] = undefined;
  })
  // 新属性添加，对于事件需要特殊处理
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(key => dom.addEventLisntener(key.toLocaleLowerCase().slice(2), nextProps[key]));
  Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(key => {
      dom[key] = nextProps[key];
  })
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = [];

function createRoot(container) {
  return {
    render: function (element) {
      wipRoot = {
        dom: container,
        props: {
          children: [element],
        },
        alternate: currentRoot,
      }
      deletions = []
      nextUnitOfWork = wipRoot;
      requestIdleCallback(workLoop)
    }
  }
}



function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;
  let domParentFiber = fiber.parent;
  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  // 如果是要删除的fiber，卸载
  if (fiber.effectTags === 'DELETION') {
    commitDeletion(fiber, domParent);
  }
  else if (fiber.effectTags === 'PLACEMENT') {
    // 如果是新增的fiber, 且存在dom
    if (fiber.dom) {
      domParent?.append(fiber.dom);
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
  } else if (fiber.effectTags === 'UPDATE') {
    // 如果只是props更新
    // commitUpate(fiber);
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
}

/** 寻找下一个fiber */
function findNextFiber(fiber) {
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;
  while (fiber.parent) {
    fiber = fiber.parent;
    if (fiber.sibling) return fiber.sibling;
  }
  return null;
}

/** 渲染当前fiber */
function performUnitOfWork(fiber) {
  if (fiber.type instanceof Function) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  return findNextFiber(fiber);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function reconcileChildren(wibFiber, elements) {
  if (elements.length) {
    let oldFiber = wibFiber.alternate && wibFiber.alternate.child;
    let index = 0;
    let preFiber;
    while(index < elements.length || oldFiber) {
      const element = elements[index];
      let newFiber
      const sameType = element && oldFiber && element.type === oldFiber.type;
      // 当前元素和旧fiber一样
      if (element && oldFiber && sameType) {
        newFiber = {
          dom: undefined,
          parent: wibFiber,
          type: element.type,
          props: element.props,
          alternate: oldFiber,
          effectTags: 'UPDATE',
        }
      }
      // 当前元素和旧fiber不一样
      if (element && !sameType) {
        newFiber = {
          dom: undefined,
          parent: wibFiber,
          type: element.type,
          props: element.props,
          alternate: null,
          effectTags: 'PLACEMENT',
        }
      }
      if (oldFiber && !sameType) {
        oldFiber.effectTags = 'DELETION';
        deletions.push(oldFiber);
      }

      if (index === 0) {
        wibFiber.child = newFiber;
      }
      if (preFiber) {
        preFiber.sibling = newFiber;
      }
      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }
      preFiber = newFiber;
      index ++;
    }
    // elements.reduce((preValue, child, idx) => {
    //   const newFiber = {
    //     dom: undefined,
    //     parent: wibFiber,
    //     ...child
    //   }
    //   if (idx === 0) {
    //     wibFiber.child = newFiber;
    //   }
    //   if (preValue) {
    //     preValue.sibling = newFiber;
    //   }
    //   return newFiber;
    // }, undefined)
  }
}

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop)
}

export default {
  createElement,
  createRoot
};