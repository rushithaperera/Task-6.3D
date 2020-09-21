const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

passport.serializeUser(function(user,done){
    done(null,user);
});

passport.deserializeUser(function(user,done){
        done(null,user)
})

passport.use(new GoogleStrategy({
    clientID:     '889524148066-a2e5j2g72glqf56vm79q9dal08hhp95a.apps.googleusercontent.com',
    clientSecret: 'OmyV0vHCPjw_C_yaFtP5ZuIB',
    callbackURL: "http://localhost:8080/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
      //using the profile info mainly the profile id to check if the user is registered in the database
      return done(null, profile);
  }
));