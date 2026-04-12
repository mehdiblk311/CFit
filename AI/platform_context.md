# UM6P_FIT - Fitness Application Context Document

## 1. Application Overview

**Project Name:** UM6P_FIT  
**Type:** Mobile-First Fitness Platform  
**Core Function:** Workout planning + Nutrition tracking + Progress monitoring  
**Status:** Validation project (1337 school assignment)  
**Owner/Builder:** Mehdi (Coomi CTO)  
**Language Support:** Multi-language (Arabic, French, English)  
**Language Direction:** RTL support required (Arabic)

---

## 2. Core Features & Functionality

### 2.1 Workout Management System

**Program-Based Hierarchy:**
- Users select or create fitness programs
- Each program contains multiple phases/weeks
- Each week contains multiple training days
- Each training day contains multiple exercises
- Each exercise has:
  - Exercise name and description
  - Target muscle group(s)
  - Sets and reps configuration
  - Rest periods between sets
  - Weight/resistance levels
  - Exercise video reference or form notes
  - Difficulty level
  - Equipment required (if any)

**Program Types Supported:**
- Pre-built programs (strength, cardio, flexibility, hypertrophy, etc.)
- Custom programs (user-created)
- Progressive overload tracking (increasing weight/reps over time)

**User Interactions with Workouts:**
- Browse available programs
- Filter by: fitness goal, duration, difficulty level, equipment
- Start a program
- Log completed workouts with:
  - Actual weight used
  - Actual reps completed
  - Actual sets completed
  - Time taken
  - Perceived difficulty (RPE - Rate of Perceived Exertion)
  - Notes on performance
- Track personal records (PRs)
- Skip or reschedule workout days
- View workout history and analytics

### 2.2 Nutrition Tracking System

**Core Nutrition Features:**
- Daily calorie tracking (target vs. actual)
- Macronutrient breakdown:
  - Protein (grams)
  - Carbohydrates (grams)
  - Fats (grams)
- Micronutrient tracking (optional):
  - Vitamins
  - Minerals
  - Fiber
- Water intake logging
- Meal logging:
  - Pre-built meal database (common foods)
  - Barcode scanning for quick food entry
  - Manual food entry with portion sizes
  - Favorite meals for quick re-logging
  - Recipe creation and tracking

**Nutrition Management:**
- Set daily calorie goals (calculated from body metrics or manual input)
- Set macro targets (auto-calculated or custom)
- Log meals throughout the day
- View remaining calories/macros at any time
- Meal timing recommendations (breakfast, lunch, dinner, snacks)
- Nutrition alerts (approaching limits, under targets)

---

## 3. User Profile & Onboarding

### 3.1 User Information Collected

**Initial Setup:**
- Name
- Age/Date of birth
- Gender
- Height
- Current weight
- Fitness goal (weight loss, muscle gain, maintenance, strength building, endurance)
- Activity level (sedentary, lightly active, moderately active, very active, extremely active)
- Experience level (beginner, intermediate, advanced)
- Equipment access (home, gym, both)
- Dietary preferences/restrictions:
  - Vegetarian, vegan, keto, paleo, halal, etc.
  - Food allergies
  - Food dislikes
- Training days per week preference
- Workout duration preference

**Ongoing Profile Data:**
- Weight tracking (weekly or custom frequency)
- Body measurements (chest, waist, hips, arms, legs - optional)
- Photos for progress tracking
- Performance metrics:
  - One-rep max estimates
  - Cardio benchmarks
  - Flexibility metrics

### 3.2 Goal Setting

**Goal Types:**
- Weight-based: "Lose 10kg in 3 months"
- Strength-based: "Bench press 100kg"
- Endurance-based: "Run 5km in 30 minutes"
- Aesthetic: "Get visible abs"
- Health: "Lower blood pressure"

**Goal Attributes:**
- Target value
- Target date
- Priority level
- Current progress tracking

---

## 4. Data & Calculation Logic

### 4.1 Key Calculations

**Caloric Needs Estimation (Initial):**
- Basal Metabolic Rate (BMR) using Harris-Benedict or Mifflin-St Jeor equation
- Total Daily Energy Expenditure (TDEE) = BMR × Activity Factor
- Caloric surplus/deficit based on goal

**Macronutrient Distribution:**
- Protein: 1.6-2.2g per kg bodyweight (muscle gain), 1.2-1.6g (maintenance/loss)
- Fat: 20-35% of total calories
- Carbs: Remaining calories after protein and fat allocation

**Progress Metrics:**
- Weekly average weight change
- Body fat percentage estimate (optional, if measurements provided)
- Strength progression (weight × reps volume)
- Caloric surplus/deficit actual vs. target
- Workout completion rate
- Program adherence percentage

### 4.2 Data Storage Requirements

**Per User:**
- Profile information
- Goal history
- Workout logs (date, program, exercises, sets, reps, weight, duration)
- Nutrition logs (food, quantity, calories, macros, time)
- Weight entries with timestamps
- Body measurement history
- Performance records (PRs, benchmarks)
- Progress photos with timestamps
- Program subscriptions/assignments

---

## 5. User Workflows

### 5.1 Daily User Flow

1. **Morning/Pre-Workout:**
   - Open app
   - Check today's scheduled workout
   - Review today's nutrition targets
   - View estimated calorie availability for the day

2. **During Workout:**
   - Log each set as completed
   - Input weight/reps actually performed
   - Option to mark as complete early or extend set count
   - Log rest periods

3. **Post-Workout:**
   - Log any notes (how felt, modifications made)
   - View performance summary vs. previous session
   - Check if PR achieved

4. **Throughout Day (Nutrition):**
   - Log breakfast
   - Log lunch
   - Log snacks
   - Log dinner
   - Scan barcodes or search food database
   - Check macro progress in real-time

5. **Evening:**
   - View daily summary:
     - Calories consumed vs. target
     - Macro breakdown vs. targets
     - Workout completed: yes/no
     - Adherence to plan

6. **Weekly:**
   - Log weight (if tracking)
   - Review progress vs. goals
   - Adjust calories if needed

### 5.2 Program Selection Workflow

1. Browse programs by goal
2. View program details:
   - Duration (weeks)
   - Weekly frequency
   - Equipment needed
   - Difficulty level
   - Expected outcomes
3. Start program (assigns to current date)
4. Program automatically generates weekly schedules

### 5.3 Analytics & Progress Viewing

- **Strength Progress:** Graph of weight × reps volume over time per exercise
- **Weight Trend:** Weekly average weight with trend line
- **Nutrition Adherence:** % of days hitting calorie target
- **Workout Adherence:** % of scheduled workouts completed
- **Caloric Balance:** Cumulative surplus/deficit over time
- **Macro Trends:** Average daily macro breakdown vs. target

---

## 6. Multi-Language & RTL Support

### 6.1 Language Requirements

**Supported Languages:**
- Arabic (with RTL layout)
- French
- English

**RTL Considerations:**
- All text direction flipped for Arabic
- Navigation/buttons mirrored for RTL
- Number formatting (may use Arabic numerals vs. European)
- Decimal separators (comma vs. period) based on locale
- Date formats (DD/MM/YYYY for FR/AR, varies for EN)

### 6.2 Localization Data

**Content to Translate:**
- All UI labels and buttons
- Exercise names and descriptions
- Food database names
- Program descriptions and phase names
- Notification messages
- Error messages
- Tip/help text
- Goal descriptions
- Macro recommendations text

---

## 7. Integration & External Data

### 7.1 Food Database

**Source:** Will need to integrate with food database (e.g., USDA FoodData Central, Open Food Facts, or custom)

**Data Fields per Food:**
- Food name (multiple languages)
- Serving size unit (grams, cups, pieces, etc.)
- Calories per serving
- Protein (g)
- Carbs (g)
- Fat (g)
- Fiber (g) - optional
- Barcode (UPC)

### 7.2 Exercise Database

**Data per Exercise:**
- Exercise name (multiple languages)
- Primary muscle group
- Secondary muscle groups
- Equipment required
- Exercise type (compound, isolation, cardio, flexibility)
- Difficulty level
- Form cues/description (for education)

---

## 8. Notification & Reminder System

**Types of Notifications:**
- Workout reminder (configurable time)
- Workout overdue (if not completed by end of day)
- Macro alerts:
  - Approaching calorie limit
  - Protein target under 80% with time remaining
  - Exceeding target by 10%
- Water intake reminder (optional, periodic throughout day)
- Weekly progress summary (optional, day/time configurable)
- Goal progress milestone (e.g., 50% toward goal)

---

## 9. Validation & Error Handling

### 9.1 Data Validation Rules

**Weight Entry:**
- Must be > 0 and < 500kg
- New entry should not deviate >5kg from previous unless confirmed
- Historical integrity (no future dates)

**Workout Logging:**
- Reps > 0
- Weight ≥ 0 (can be 0 for bodyweight)
- Rest period ≥ 0 seconds
- Sets > 0

**Nutrition Logging:**
- Quantity > 0
- Valid portion size unit selected
- Food item exists in database

---

## 10. User Engagement & Motivation

**Gamification Elements (Optional):**
- Streak tracking (consecutive days logged)
- Milestone badges (e.g., 10kg lost, 50 workouts completed)
- Progress comparison to previous weeks
- Goal achievement celebration
- Personal records highlighted

**Progress Metrics Displayed:**
- Total workouts completed (all-time)
- Current streak
- Weight/measurement change
- Strength gains (e.g., "+20kg on bench press")
- Consistency percentage

---

## 11. Performance Considerations

**Data Volume per User (Estimate):**
- 1-2 years of data = ~500-1000 nutrition entries + 300-500 workout entries
- Small file size per entry (< 1KB each when structured)
- Images (progress photos): ~1-3MB per photo, typically 2-4 photos

**Real-Time Requirements:**
- Calorie calculation should be instant
- Barcode scanning should return results in <2 seconds
- Weight/rep entry should feel responsive (<100ms UI feedback)

---

## 12. Accessibility & Usability

**Core Usability Goals:**
- Quick entry methods (barcode scan, favorites, search)
- Large tap targets for mobile
- Clear visual feedback for all actions
- Minimal typing required during workouts
- Voice input for logging during exercise (optional future)

**Accessibility Requirements:**
- Text contrast ratios for readability
- Alt text for images/icons
- RTL-compatible accessibility tree
- Keyboard navigation support
- Screen reader compatibility

---

## 13. Future Enhancement Possibilities

**Phase 2 Features:**
- Social features (friend tracking, shared programs, challenges)
- Coach/trainer interface (manage multiple clients)
- API for wearable integration (Apple Health, Google Fit, Fitbit)
- Advanced analytics (periodization tracking, deload weeks)
- AI-powered program recommendations based on progress
- Meal planning automation
- Integration with macro-tracking apps
- Progressive overload suggestions
- Form analysis (video upload, AI feedback - future)

---

## 14. Business Model & Monetization (Context)

**Current Status:** Validation/MVP project for school

**Potential Monetization (Future):**
- Free tier: Basic program access, 30-day nutrition history
- Premium tier: Custom programs, unlimited history, advanced analytics
- Coach tier: Multi-client management, custom program creation tools
- Subscription model (monthly/annual)

---

## 15. Technical Architecture Context

**Target Platform:** Mobile-first (iOS/Android)  
**Builder:** Mehdi (Full stack ownership)  
**Data Persistence:** User profiles, workouts, nutrition, goals (persistent backend)  
**User Authentication:** Required for data sync and multi-device access  
**Offline Capability:** Workouts and nutrition logging should work offline, sync when online

---

## 16. Success Metrics & Validation Goals

**For 1337 School Project:**
- Functional workout logging with program structure
- Functional nutrition tracking with macro calculation
- Multi-language support working
- RTL layout functional
- User can complete typical daily flow (workout + nutrition logging)
- Progress tracking (graphs, summaries)
- Goal tracking and milestone detection

**Expected User Journey Time:**
- Onboarding: 5-10 minutes
- Logging workout: 3-5 minutes (pre-workout) + 5-10 minutes (during) + 2-3 minutes (post-workout)
- Logging nutrition: 1-2 minutes per meal
- Checking progress: 2-3 minutes

---

## End of Context Document

**Document Purpose:** This document provides functional and business context for AI agents, coaches, or developers to understand UM6P_FIT's features, workflows, data requirements, and logic without reference to visual design, styling, or UI/UX presentation.