# Cfit — React Architecture

A fitness web app for  students. Multilingual (AR/FR/EN), mobile-first, PWA-ready.

---


## Folder Structure

```
src/
├── components/
│   ├── common/        # Reusable UI: Button, Input, Card, Modal, Toast, Skeleton, Navigation
│   ├── auth/          # LoginScreen, SignupScreen, OnboardingWizard
│   ├── user/          # Dashboard, Workouts, Nutrition, AIAssistant, Settings
│   └── admin/         # Dashboard, UserManagement, ExerciseLibrary, FoodDatabase, WorkoutTemplates
├── hooks/             # useAuth · useWorkout · useNutrition · useMacros · useLanguage
├── context/           # AuthContext · UserDataContext · WorkoutContext · NutritionContext · ThemeContext
├── services/          # api.js + one service file per domain (auth, workout, nutrition, ai, admin)
├── utils/             # constants.js · formatters · calculations · validators
├── styles/            # globals.css (CSS vars) · theme.css · responsive.css
├── pages/             # UserLayout · AdminLayout · AuthLayout
└── App.jsx            # Router root — wraps all contexts, splits routes by role
```