/** @jsxRuntime classic */
import logo from './logo.svg';
import './index.css';
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import reportWebVitals from './reportWebVitals';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );


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

let nextUnitOfWork = null;
let wipRoot = null;

function createDom(fiber) {
  // 如果没有type，说明是根fiber
  if (!fiber.type) {
    return;
  }
  const dom = fiber.type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(fiber.type);

  const isProperty = (key) => key !== 'children';

  Object.keys(fiber.props).filter(isProperty).forEach(key => {
    dom[key] = fiber.props[key]
  })
  return dom;
}


function createRoot(container) {
  return {
    render: function (element) {
      nextUnitOfWork = {
        dom: container,
        props: {
          children: [element],
        },
      }
      requestIdleCallback(workLoop)
    }
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
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  if (fiber.parent) {
    fiber.parent.dom.append(fiber.dom);
  }
  const unitChildren = fiber.props.children;
  if (unitChildren.length) {
    unitChildren.reduce((preValue, child, idx) => {
      const newFiber = {
        dom: undefined,
        parent: fiber,
        ...child
      }
      if (idx === 0) {
        fiber.child = newFiber;
      }
      if (preValue) {
        preValue.sibling = newFiber;
      }
      return newFiber;
    }, undefined)
  }
  return findNextFiber(fiber);
}

function workLoop(deadline) {
  let shouldYield = false
  if (wipRoot) {
    nextUnitOfWork = wipRoot;
  }
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  if (nextUnitOfWork) {
    wipRoot = nextUnitOfWork;
  }
  requestIdleCallback(workLoop)
}

const Didact = {
  createElement,
  createRoot
};

/** @jsx Didact.createElement */
const App = (
  <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Edit <code>src/App.js</code> and save to reload.
      </p>
      <a
        className="App-link"
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn React11
      </a>
    </header>
  </div>
);

const root = Didact.createRoot(document.getElementById('root'));
root.render(App);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
