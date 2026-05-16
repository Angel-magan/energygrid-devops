const MAX_LOGS = 200;

let logs = [];

const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

const appendLog = ({
  level = "INFO",
  service = "System",
  message = "",
} = {}) => {
  const entry = {
    id: makeId(),
    ts: Date.now(),
    level,
    service,
    message,
  };

  logs = [entry, ...logs].slice(0, MAX_LOGS);
  return entry;
};

const getLogs = (limit = 50) => {
  const n = Math.max(1, Math.min(Number(limit) || 50, MAX_LOGS));
  return logs.slice(0, n);
};

module.exports = { appendLog, getLogs };
