// Импортируем HttpCode и HttpStatus
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService, NotificationsSummary } from './auth.service';
import { Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<{ access_token: string }> {
    return this.authService.signup(dto);
  }

  // --- ИЗМЕНЕНИЯ ЗДЕСЬ ---

  @HttpCode(HttpStatus.OK) // <--- Добавьте эту строку
  @Post('signin')
  signin(@Body() dto: SigninDto): Promise<{ access_token: string }> {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtAuthGuard) // <--- Защищаем этот роут
  @Get('me')
  getProfile(@Request() req) {
    // Стратегия JWT уже расшифровала токен и положила данные в req.user
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notifications')
  getNotificationsSummary(@Request() req): Promise<NotificationsSummary> {
    return this.authService.getUnreadNotifications(req.user.sub);
  }
}
