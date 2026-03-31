const clients = new Set();

const addClient = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
};

const broadcastStatus = (statusMessage) => {
  for (const client of clients) {
    client.write(`data: ${JSON.stringify({ status: statusMessage })}\n\n`);
  }
};

module.exports = {
  addClient,
  broadcastStatus
};