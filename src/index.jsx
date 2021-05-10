import * as PReact from './lib/preact';

const element = PReact.createElement(
  'div',
  { id: 'foo',},
  PReact.createElement('a', null, 'bar'),
  PReact.createElement('b')
)

/** @jsx PReact.createElement */
const elements =
  <Counter />

const useState = PReact.useState;

/** @jsx PReact.createElement */
function Counter() {
  const [count, setCount] = useState(0);

  return (<div>
    <h1 onClick={()=> setCount( c => c+1)}>count:{count}</h1>
  </div>)
}


window.onload = () => {
  const container = document.getElementById('root');
  PReact.render(elements, container)
}