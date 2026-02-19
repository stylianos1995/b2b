import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  NotImplementedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SeedService } from "../seeds/seed.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { RequestContext } from "../common/interfaces/request-context.interface";

@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private seedService: SeedService,
  ) {}

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("dev/run-seed")
  @HttpCode(HttpStatus.OK)
  async runSeed() {
    await this.seedService.run();
    const fixResult = await this.authService.fixSeedPasswords();
    return {
      ok: true,
      message:
        'Seed completed. Seed user passwords set to "password". You can now log in.',
      ...fixResult,
    };
  }

  @Public()
  @Post("dev/fix-seed-passwords")
  @HttpCode(HttpStatus.OK)
  async fixSeedPasswords() {
    return this.authService.fixSeedPasswords();
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const email =
      typeof dto.email === "string"
        ? dto.email.trim().toLowerCase()
        : dto.email;
    const password =
      typeof dto.password === "string" ? dto.password.trim() : dto.password;
    return this.authService.login(email, password);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: { refresh_token?: string }) {
    await this.authService.logout(body?.refresh_token);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get("me")
  async me(@CurrentUser() user: RequestContext) {
    return this.authService.getMe(user);
  }

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: RequestContext,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: RequestContext,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.userId, dto);
  }

  @Post("change-email")
  @HttpCode(HttpStatus.OK)
  async changeEmail(
    @CurrentUser() user: RequestContext,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(user.userId, dto);
  }

  @Post("delete-account")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(
    @CurrentUser() user: RequestContext,
    @Body() dto: DeleteAccountDto,
  ) {
    await this.authService.deleteAccount(user.userId, dto);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword() {
    throw new NotImplementedException("Use support flow for MVP");
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword() {
    throw new NotImplementedException("Use support flow for MVP");
  }
}
