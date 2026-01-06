import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("RAW NODE OK");
});

server.listen(4000, "0.0.0.0", () => {
  console.log("RAW NODE server listening on port 4000");
});
