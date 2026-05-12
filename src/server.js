const http = require('http');
const { createApp, createIo } = require('./app');

const port = Number(process.env.PORT) || 3000;
const app = createApp();
const server = http.createServer(app);
createIo(server);

server.listen(port, () => {
  console.log(`todo-api listening on http://localhost:${port}`);
});
