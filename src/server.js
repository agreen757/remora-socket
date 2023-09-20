import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Put all your backend code here.
wss.on("connection", (socket) => {
  socket.send(socket);

  socket.addEventListener("message", (event) => {
    console.log(event);
    let data = event.data ? JSON.parse(event.data) : null;

    if (data) {
      //contains the id (remora-test..)
    }
  });
});

server.listen(process.env.PORT, handleListen);
