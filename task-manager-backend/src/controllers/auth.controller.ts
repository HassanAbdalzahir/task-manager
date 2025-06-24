import { Request, Response, NextFunction } from "express";
import { authService, RegisterData, LoginData } from "../services/auth.service";
import { asyncHandler } from "../middleware/errorHandler";
import logger from "../utils/logger";

export class AuthController {
  register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { name, email, password, role, managerId }: RegisterData = req.body;

      // Validate required fields
      if (!name || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: "Name, email, password, and role are required",
        });
        return;
      }

      // Validate role
      if (!["CEO", "Manager", "Employee"].includes(role)) {
        res.status(400).json({
          success: false,
          message: "Role must be CEO, Manager, or Employee",
        });
        return;
      }

      const result = await authService.register({
        name,
        email,
        password,
        role,
        managerId,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          accessToken: result.token,
          refreshToken: result.token, // For now, using the same token as refresh token
        },
      });
    }
  );

  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { email, password }: LoginData = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
        return;
      }

      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.token,
          refreshToken: result.token, // For now, using the same token as refresh token
        },
      });
    }
  );

  getProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    }
  );

  refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token is required",
        });
        return;
      }

      const user = await authService.validateToken(token);
      const newToken = authService.generateToken(user);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user,
          accessToken: newToken,
        },
      });
    }
  );
}

export const authController = new AuthController();
export default authController;
