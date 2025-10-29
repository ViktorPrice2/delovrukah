import { Body, Controller, Post } from '@nestjs/common';
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

  @Post('signin')
  signin(@Body() dto: SigninDto): Promise<{ access_token: string }> {
    return this.authService.signin(dto);
  }
}
