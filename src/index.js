import * as PReact from './lib/preact';

const element = PReact.createElement(
  'div',
  { id: 'foo' },
  PReact.createElement('a', null, 'bar'),
  PReact.createElement('b')
)

/** @jsx PReact.createElement */
const elements = <div id='foo1'>
  <a>this is a </a>
</div>

window.onload = () => {
  const container = document.getElementById('root');
  PReact.render(elements, container)
}