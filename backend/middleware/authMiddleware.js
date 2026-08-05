export const authMiddleware = (req, res, next) => {
  const token = req.header('X-Auth-Token');

  if (!token || token !== process.env.SECRET_API_KEY) {
    return res.status(401).json({
      message: 'Unauthorized: invalid or missing X-Auth-Token header.',
    });
  }

  return next();
};

export default authMiddleware;

