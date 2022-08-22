/** @jsxRuntime classic */
import logo from './logo.svg';
import './index.css';
import Didact from './didact';
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

/** @jsx Didact.createElement */
const App = () => {
  const [v, setV] = Didact.useState(123);
  console.log('v', v)
  return (
    <div className="App">
      <input value={v} onChange={({ target: value }) => setV(() => value)} />
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
          {v}
        </a>
      </header>
    </div>
  )
};

const root = Didact.createRoot(document.getElementById('root'));
let text = 123;
root.render(<div>
  <App text={text} />
</div>);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(console.log);
