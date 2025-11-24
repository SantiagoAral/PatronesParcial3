let ws;
const logEl = document.getElementById('log');
const log = (t) => { logEl.innerText += '\n' + t; logEl.scrollTop = logEl.scrollHeight; };

document.getElementById('connect').onclick = () => {
  const token = document.getElementById('token').value;
  if (!token) { alert('token required'); return; }
  ws = new WebSocket('ws://localhost:4000/ws?token=' + encodeURIComponent(token));
  ws.onopen = () => log('connected');
  ws.onmessage = (m) => log('recv: ' + m.data);
  ws.onclose = () => log('closed');
};

document.getElementById('sub').onclick = () => {
  const room = document.getElementById('room').value;
  ws.send(JSON.stringify({ type: 'SUBSCRIBE', roomId: String(room) }));
};

document.getElementById('unsub').onclick = () => {
  const room = document.getElementById('room').value;
  ws.send(JSON.stringify({ type: 'UNSUBSCRIBE', roomId: String(room) }));
};

document.getElementById('send').onclick = () => {
  const content = document.getElementById('msg').value;
  const room = document.getElementById('room').value;
  ws.send(JSON.stringify({ type: 'MESSAGE', roomId: String(room), content }));
  document.getElementById('msg').value = '';
};
