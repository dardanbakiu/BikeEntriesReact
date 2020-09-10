const httpServer = require("http").createServer();
const jsonServer = require("json-server");
const { Socket } = require("dgram");
const server = jsonServer.create();
const io = require("socket.io")(httpServer);
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const apiPort = 3030;
const wsPort = 3031;

server.use(middlewares);

const isAuthorized = req => {
  if (!req.headers.authorization) {
    return false;
  }

  return (
    req.headers.authorization ===
    "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImp0aSI6IjMzNzYzNzc4LWU3NWEtNDFhNS04YjM1LTNiZjE1NWExOGFjMiIsImlhdCI6MTU4MTA4MzQ2OSwiZXhwIjoxNTgxMDg3MDY5fQ.L79WlKbdiMvS_n8GzhpZAB3OTgE13MWgXa_WkCCHKn8"
  );
};

server.use((req, res, next) => {
  if (isAuthorized(req)) {
    // add your authorization logic here
    next(); // continue to JSON Server router
  } else {
    res.sendStatus(401);
  }
});
server.use(router);

server.listen(apiPort, () => {
  console.log("JSON Server is running on port " + apiPort);
});

const clients = {};


io.on("connection", client => {
  console.log("client connected " + client.id);
  clients[client.id] = client;


  client.on("status.online", data => {
    console.log(data)
    clients[client.id].emit("status.changed", { to: "online", success: true });
  });

  client.on("status.offline", () => {
    clients[client.id].emit("status.changed", { to: "offline", success: true });
  });

  client.on("disconnect", () => {
    console.log("client disconnected");
    delete clients[client.id];
 
  });
});

httpServer.listen(wsPort, () => {
  console.log("socket listener started on port " + wsPort);
});

send();

function send() {
  let nextInterval = Math.floor(Math.random() * 3000) + 700; // between 0.7 and 3 seconds
  let count = Math.floor(Math.random() * 4) + 1; // 1-4 count sent

  Object.values(clients).forEach(c => {
    c.emit("members.new", {
      count: count
    });
  });

  setTimeout(() => {
    send();
  }, nextInterval);
}