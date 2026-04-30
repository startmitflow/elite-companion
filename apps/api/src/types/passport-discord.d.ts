declare module 'passport-discord' {
  import { Strategy as PassportStrategy } from 'passport';

  interface DiscordProfile {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    email?: string;
  }

  interface DiscordStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  }

  class DiscordStrategy extends PassportStrategy {
    constructor(
      options: DiscordStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: DiscordProfile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }

  export { DiscordStrategy as Strategy, DiscordProfile };
}