# Mapa pantalla-prototipo → pantalla-real

| # | Pantalla en el prototipo (artboard)        | Archivo real en `frontend/src/pages/`       |
| - | ------------------------------------------ | ------------------------------------------- |
| 1 | 01 Onboarding                              | (post-registro · ver nota)                  |
| 2 | 02 Test introductorio                      | `IntroductoryTest.tsx`                      |
| 3 | 03 Dashboard                               | `Dashboard.tsx`                             |
| 4 | 04 Teoría                                  | `Theory.tsx`                                |
| 5 | 05 Práctica                                | `Exercises.tsx`                             |
| 6 | 06 Test de salida                          | `ExitTest.tsx`                              |
| 7 | 07 Reporte de progreso                     | (sub-vista de `Dashboard.tsx`)              |
| 8 | 08 Encuesta                                | `Survey.tsx`                                |
| 9 | 09 Login                                   | `Login.tsx`                                 |
|10 | 10 Register                                | `Register.tsx`                              |
|11 | 11 Consentimiento                          | `Consent.tsx`                               |
|12 | 12 Perfil                                  | `Profile.tsx`                               |
|13 | 13 Cambiar contraseña                      | `PasswordChange.tsx`                        |
|14 | 14 Tutor IA (chat)                         | `Chatbot.tsx`                               |
|15 | 15 Admin                                   | `AdminDashboard.tsx`                        |

**Nota onboarding**: en el prototipo el onboarding (objetivos · nivel · horario)
es un paso post-registro. En el codebase actual no existe como pantalla aparte;
se puede agregar como `Onboarding.tsx` ruteado tras el primer login.

## Layout shell

Todas las pantallas (excepto login/register/consent/passwd) comparten el mismo shell:

```
┌─ titlebar mac (● ● ●  · mathlab — ~/path/actual) ───┐
│                                                    │
│  ┌─ TMNav: dashboard · teoría · práctica · tutor ─┐│
│                                                    │
│  ┌─ contenido scrollable ────────────────────────┐ │
│  │                                                │ │
│  │  $ ./prompt-de-la-pantalla                     │ │
│  │  > Título grande                               │ │
│  │  // subtítulo en `dim`                         │ │
│  │                                                │ │
│  │  <TMBox>...                                    │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

Login / Register / Consent / PasswordChange usan TMFrame **sin TMNav**, con el
contenido centrado verticalmente (no scroll).
