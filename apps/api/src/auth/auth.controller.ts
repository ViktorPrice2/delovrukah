// Импортируем HttpCode и HttpStatus
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';

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
}