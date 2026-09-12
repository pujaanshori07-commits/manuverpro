# Manuver — App Store Metadata & Beta Testing Guide

## 1. App Store Listing Metadata

### App Name
`Manuver`

### Subtitle (iOS)
`Find Your Play Partner`

### Primary & Secondary Categories
- Primary: **Sports**
- Secondary: **Lifestyle**

### Content Rating
`17+` (Includes user matching, location-based discovery, and unmoderated real-time chat)

---

### App Store Description (150 Words)
```text
Manuver: Find Your Perfect Play Partner

Tired of playing sports alone or struggling to find reliable partners? Manuver connects you with nearby athletes who match your sport preferences, schedule, and skill level.

✅ Discover: Swipe through players in your area, filtered by sport, distance, and skill level.
✅ Connect: Chat with matches in real-time to plan games and practice sessions.
✅ Play: Schedule venue meetups easily and start training together.
✅ Safe & Controlled: Built-in safety controls with instant block and report features.

Whether you are into basketball, tennis, badminton, soccer, running, or gym workouts, Manuver helps you find your next training buddy. Built for athletes, by athletes.

Download Manuver today and find your next match!
```

---

### App Store Search Keywords (15 Terms)
1. sports partner finder
2. workout buddy
3. tennis partner
4. badminton friends
5. basketball court
6. fitness community
7. local athletes
8. training partner
9. sports matching
10. play partner
11. exercise friends
12. sports app
13. athletic community
14. find players
15. sports meetup

---

### Support & Legal URLs
- **Support URL**: `https://manuver.app/support` (or `support@manuver.app`)
- **Privacy Policy URL**: In-app via Settings > Privacy Policy
- **Terms of Service URL**: In-app via Settings > Terms of Service

---

## 2. Beta Recruitment & Testing Plan

### Target Audience & Goal
- **Target**: 15–20 active sports players (iOS & Android)
- **Testing Duration**: 2 Weeks
- **Incentive**: Free lifetime premium membership + early access perks

---

### Recruitment Form Setup (Google Forms / Typeform)
1. **Full Name & Contact Email**
2. **Sports Played** (Basketball, Tennis, Badminton, Soccer, Gym, Running, Volleyball, etc.)
3. **Weekly Play Frequency** (1–2x, 3–4x, 5+ times)
4. **Device Platform** (iOS / Android)
5. **Willingness to submit feedback twice weekly** (Yes / No)

---

### Distribution Instructions

#### iOS (Apple TestFlight)
1. Run `eas build --platform ios --profile preview` to build the TestFlight build artifact.
2. In App Store Connect, upload the build to **TestFlight**.
3. Create an External Testing group and paste the invite URL or invite testers via email.

#### Android (Google Play Internal Testing)
1. Run `eas build --platform android --profile preview` to build the APK / App Bundle.
2. In Google Play Console, upload the build under **Internal Testing**.
3. Add tester Google account emails and share the opt-in link.
