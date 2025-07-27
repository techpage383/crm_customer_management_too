import jwt from 'jsonwebtoken';

export const generateTokens = (userId: string) => {
  const secret = process.env.JWT_SECRET!;
  
  const accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  const accessToken = (jwt as any).sign({ userId }, secret, { expiresIn: accessTokenExpiresIn });
  const refreshToken = (jwt as any).sign({ userId }, secret, { expiresIn: refreshTokenExpiresIn });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};