// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (e) { done(e, null); }
});

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL,
} = process.env;

/** -------- GOOGLE -------- */
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      proxy: true,
    },
    async (_at, _rt, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('Google profile has no email'), null);

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile.displayName || 'No Name',
            email,
            password: Math.random().toString(36).slice(-12),
            avatar: profile.photos?.[0]?.value || '',
            isActive: true,
            isEmailVerified: true,
            provider: 'google',
            providerId: profile.id,
            lastLogin: new Date(),
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
} else {
  console.warn('⚠️ Google OAuth not registered. Missing GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL');
}

/** -------- FACEBOOK -------- */
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && FACEBOOK_CALLBACK_URL) {
  passport.use(new FacebookStrategy(
    {
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails', 'photos'],
      proxy: true,
    },
    async (_at, _rt, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase()
          || `facebook_${profile.id}@example.local`;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile.displayName || 'No Name',
            email,
            password: Math.random().toString(36).slice(-12),
            avatar: profile.photos?.[0]?.value || '',
            isActive: true,
            provider: 'facebook',
            providerId: profile.id,
            lastLogin: new Date(),
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
} else {
  console.warn('⚠️ Facebook OAuth not registered. Missing FACEBOOK_APP_ID/SECRET/CALLBACK_URL');
}

export default passport;
