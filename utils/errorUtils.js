// utils/errorUtils.js
function handleUnauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' });
}

export default handleUnauthorized;
