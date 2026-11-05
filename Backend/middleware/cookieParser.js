/**
 * Middleware to parse HTTP Cookie header and populate req.cookies.
 * Lightweight, zero-dependency, and safe against malformed cookie values.
 */
export const cookieParser = (req, res, next) => {
  if (req.cookies) {
    return next();
  }

  const cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader && typeof cookieHeader === "string") {
    const pairs = cookieHeader.split(";");
    for (const pair of pairs) {
      const idx = pair.indexOf("=");
      if (idx > -1) {
        const key = pair.substring(0, idx).trim();
        const val = pair.substring(idx + 1).trim();
        try {
          cookies[key] = decodeURIComponent(val);
        } catch {
          cookies[key] = val;
        }
      }
    }
  }

  req.cookies = cookies;
  next();
};

export default cookieParser;

