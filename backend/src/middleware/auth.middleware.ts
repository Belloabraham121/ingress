import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";

interface JwtPayload {
  id: string;
}

/**
 * Protect routes - require authentication
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized to access this route - no token provided",
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      // Find user
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Attach user to request
      (req as any).user = { id: user._id.toString() };
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Not authorized to access this route - invalid token",
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in authentication middleware",
      error: (error as Error).message,
    });
  }
};

