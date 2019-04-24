
import createTerminalWindow from './TerminalWindow';
import createLogWindow from './LogWindow';
import './index.css';


// generate websocket url
const loc = window.location;
const protocal = (loc.protocol === 'https:' ? 'wss:' : 'ws:');
const {
  project, env, name, isLog,
} = window.wsArgs;
let { host } = window.wsArgs;
host = host || loc.host;

const path = isLog ? 'pods-log' : 'pods-terminal';
const wsUrl = `${protocal}//${host}/api/ws/${path}?project=${project}&env=${env}&name=${name}`;
console.log(wsUrl);

if (isLog) {
  createLogWindow(wsUrl);
} else {
  createTerminalWindow(wsUrl);
}
