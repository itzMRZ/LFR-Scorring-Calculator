# LFR Score Calculator

Web-based scoring calculator for Line Following Robot competitions.

**Live:** [scorebot.itzmrz.xyz](https://scorebot.itzmrz.xyz)

## Features

- Real-time scoring with detailed breakdown
- Built-in stopwatch (millisecond precision)
- Customizable scoring parameters
- Competition presets (RoboCup Junior, WRO, FIRST LEGO League)
- Import/Export configurations (JSON)
- Dark mode
- Persistent settings (localStorage)
- Mobile responsive

## Files

- **`index.html`** - Application structure
- **`css/styles.css`** - Styling and themes
- **`js/app.js`** - Scoring logic and functionality

## Scoring Formula

```
Total Score = S + E + C + R + B + T

S = Start Point (default: +20)
E = End Point (default: +20)
C = Checkpoints × Checkpoint Value (default: +150)
R = Restarts × Restart Penalty (default: -70)
B = Perfect Bonus (+150 if no restarts AND reached end)
T = (Total Time - Elapsed Time) × Time Multiplier (×5)
```

## Usage

1. Set time allocation and Scoring policcy on Settings
2. Use stopwatch to track run
3. Enter start/end status, checkpoints, restarts
4. Click Calculate

## Author

[itzMRZ](https://github.com/itzMRZ)
