import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { RequestContext, Membership } from '../../common/interfaces/request-context.interface';
import { BusinessUser } from '../../entities/business-user.entity';
import { ProviderUser } from '../../entities/provider-user.entity';
import { User } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private configService: ConfigService;

  constructor(
    configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(BusinessUser) private businessUserRepo: Repository<BusinessUser>,
    @InjectRepository(ProviderUser) private providerUserRepo: Repository<ProviderUser>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    this.configService = configService;
  }

  async validate(payload: JwtPayload): Promise<RequestContext> {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Use refresh endpoint with refresh token');
    }
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }
    const [businessMemberships, providerMemberships] = await Promise.all([
      this.businessUserRepo.find({ where: { user_id: user.id }, select: ['business_id', 'role'] }),
      this.providerUserRepo.find({ where: { user_id: user.id }, select: ['provider_id', 'role'] }),
    ]);
    const memberships: Membership[] = [
      ...businessMemberships.map((m) => ({ businessId: m.business_id, role: m.role })),
      ...providerMemberships.map((m) => ({ providerId: m.provider_id, role: m.role })),
    ];
    const adminEmails = this.configService.get<string>('PLATFORM_ADMIN_EMAILS', '')?.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
    if (adminEmails.includes(user.email.toLowerCase())) {
      memberships.push({ role: 'platform_admin' });
    }
    return {
      userId: user.id,
      email: user.email,
      memberships,
    };
  }
}
