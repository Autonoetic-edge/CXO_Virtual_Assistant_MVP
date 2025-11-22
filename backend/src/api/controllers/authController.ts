import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../models/User';
import config from '../../config';
import logger from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';

export class AuthController {
  // Generate JWT token
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  // Generate refresh token
  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  // Sign up
  static async signup(req: Request, res: Response) {
    try {
      const { email, first_name, last_name, timezone, language } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        throw new AppError('User already exists with this email', 409);
      }

      // Create user
      const user = await UserModel.create({
        email,
        first_name,
        last_name,
        timezone: timezone || 'Asia/Kolkata',
        language: language || 'en',
      });

      // Generate tokens
      const token = AuthController.generateToken(user.id);
      const refreshToken = AuthController.generateRefreshToken(user.id);

      // Update last login
      await UserModel.updateLastLogin(user.id);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          timezone: user.timezone,
          language: user.language,
        },
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error('Signup error:', error);
      throw error;
    }
  }

  // Login (mock for development)
  static async login(req: Request, res: Response) {
    try {
      const { email } = req.body;

      // Find user
      let user = await UserModel.findByEmail(email);

      // For development, create user if doesn't exist
      if (!user && config.app.env === 'development') {
        user = await UserModel.create({
          email,
          first_name: 'Demo',
          last_name: 'User',
        });
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate tokens
      const token = AuthController.generateToken(user.id);
      const refreshToken = AuthController.generateRefreshToken(user.id);

      // Update last login
      await UserModel.updateLastLogin(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          timezone: user.timezone,
          language: user.language,
        },
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

      // Get user
      const user = await UserModel.findById(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new tokens
      const newToken = AuthController.generateToken(user.id);
      const newRefreshToken = AuthController.generateRefreshToken(user.id);

      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Refresh token expired', 401);
      }
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  // Get current user
  static async getCurrentUser(req: any, res: Response) {
    try {
      const user = await UserModel.findById(req.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          timezone: user.timezone,
          work_hours_start: user.work_hours_start,
          work_hours_end: user.work_hours_end,
          language: user.language,
          status: user.status,
        },
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }
}
