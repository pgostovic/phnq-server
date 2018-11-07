import http from 'http';
import Koa from 'koa';
import serve from 'koa-static';
import compress from 'koa-compress';
import dotenv from 'dotenv';
import WebSocket from 'ws';
import koaWebpack from 'koa-webpack';
import Connection from './connection';
import { init as initData } from './data';
import webpackConfig from '../etc/webpack';

dotenv.config();

initData();

const app = new Koa();

if (process.env.NODE_ENV === 'production') {
  app.use(compress()).use(serve(`${__dirname}/../clientApiGen/`));
} else {
  (async () => {
    app.use(await koaWebpack({ config: webpackConfig }));
  })();
}

const server = http.createServer(app.callback());

server.on('upgrade', (request, socket) => {
  if (request.url !== '/api') {
    socket.destroy();
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  let conn = new Connection();

  conn.onClose(() => {
    ws.close(1000, 'Closed by server');
  });

  conn.onMessage(message => {
    ws.send(JSON.stringify(message));
  });

  ws.on('message', message => {
    conn.handle(JSON.parse(message));
  });

  ws.on('close', () => {
    console.log('CLOSE');
    conn.destroy();
    conn = null;
  });
});

server.listen(process.env.PORT || 9090);
