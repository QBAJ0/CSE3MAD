// data/challenges.ts — canonical XP challenge catalog (Challenges tab, `/challenge/...`).

// Official STEMM challenge definitions for the `/challenge/[id]` flow.
import { Challenge } from "../types";

export const CHALLENGES: Challenge[] = [
  // Activity 1: Parachute Drop
  {
    id: 1,
    title: "Parachute Drop",
    category: "Engineering Challenges",
    icon: "arrow-down-circle-outline",
    color: "#F97316",
    shortDescription:
      "Design and test a parachute for the slowest, safest landing.",
    overview:
      "Design, build, and test a parachute for a small toy to reduce landing speed and impact force.",
    equipment: [
      "Mobile phone with STEMM Lab app",
      "Small toy",
      "Paper/plastic",
      "String",
      "Scissors",
      "Tape",
      "Table",
    ],
    instructions: [
      "Drop the toy without a parachute and record the fall as a baseline test",
      "Build a parachute using paper or plastic, string, scissors, and tape",
      "Drop the toy from the same height and record fall time",
      "Record a slow-motion video of the landing",
      "Review speed, landing safety, and accuracy results in the app",
      "Redesign and test up to 3 prototypes within 20 minutes",
    ],
    features: ["predictionRequired", "video", "gps", "multiplePrototypes"],
    maxPrototypes: 3,
    estimatedMinutes: 20,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "designName",
        label: "Design name",
        recorder: "manualText",
        placeholder: "e.g. Plastic, 4 corners",
      },
      {
        key: "dropHeightMeters",
        label: "Drop height (measure once for all designs)",
        unit: "m",
        recorder: "manualNumber",
        placeholder: "e.g. 0.75",
      },
      {
        key: "slowMotionVideo",
        label: "Slow-motion Video",
        recorder: "video",
      },
      {
        key: "fallTimeSeconds",
        label: "Fall time",
        unit: "s",
        recorder: "stopwatch",
        placeholder: "0.00",
      },
      {
        key: "videoAnalysis",
        label: "Frame Analysis",
        recorder: "videoAnalyzer",
      },
      {
        key: "toyMassKg",
        label: "Toy mass",
        unit: "kg",
        recorder: "manualNumber",
        placeholder: "e.g. 0.05",
        difficulty: "highSchool",
      },
      {
        key: "contactTimeSeconds",
        label: "Contact time (slow-motion)",
        unit: "s",
        recorder: "manualNumber",
        placeholder: "e.g. 0.05",
        difficulty: "highSchool",
      },
      {
        key: "bounced",
        label: "Did the toy bounce?",
        recorder: "manualChoice",
        choices: ["No", "Yes"],
        difficulty: "highSchool",
      },
      {
        key: "timeToMaxHeightSeconds",
        label: "Time to bounce peak",
        unit: "s",
        recorder: "manualNumber",
        placeholder: "Only if it bounced",
        difficulty: "highSchool",
        optional: true,
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    derivedMetrics: [
      {
        key: "finalVelocity",
        label: "Final velocity",
        unit: "m/s",
        difficulty: "highSchool",
      },
      {
        key: "acceleration",
        label: "Acceleration",
        unit: "m/s²",
        difficulty: "highSchool",
      },
      {
        key: "netForce",
        label: "Net force",
        unit: "N",
        difficulty: "highSchool",
      },
      {
        key: "dragForce",
        label: "Drag force",
        unit: "N",
        difficulty: "highSchool",
      },
      {
        key: "gForce",
        label: "G-force on impact",
        unit: "g",
        difficulty: "highSchool",
      },
    ],
    curriculumLinks: ["ACSSU076 - Forces affect motion"],
    predictionPrompt: "Which parachute design do you think will fall the slowest? What size and material will work best?",
    extensionTip: "Try cutting a small hole in the centre of your canopy — does it actually fall more steadily? Engineers use this trick on real parachutes!",
    thingsToKnow: [
      {
        heading: "What is drag?",
        color: "#2563EB",
        bullets: [
          "Drag is a force that opposes movement through air.",
          "A bigger canopy catches more air = more drag = slower fall.",
          "Drag force increases with canopy area and air density.",
        ],
      },
      {
        heading: "Materials matter!",
        color: "#2563EB",
        bullets: [
          "Lighter, larger canopies create more drag.",
          "Thin plastic is better than paper — it doesn't crumple.",
          "String length affects stability during descent.",
        ],
      },
      {
        heading: "Newton's laws at work",
        color: "#F97316",
        bullets: [
          "Gravity pulls your toy downward at 9.8 m/s².",
          "When drag force equals gravity, the toy reaches terminal velocity.",
          "The net force = Gravity − Drag.",
        ],
      },
    ],
    observationQuestions: [
      "Which parachute design did you predict would fall the slowest?",
      "Were your timing predictions correct?",
      "Which design was the easiest to make?",
      "Did anything surprise you about the results?",
    ],
  },
  // Activity 2: Sound Pollution
  {
    id: 2,
    title: "Sound Pollution Hunter",
    category: "Engineering Challenges",
    icon: "volume-high-outline",
    color: "#2563EB",
    shortDescription:
      "Measure classroom sounds and compare loud and quiet zones.",
    overview:
      "Measure sound levels in different activities and map noise pollution zones.",
    equipment: ["Mobile phone with STEMM Lab app and microphone"],
    instructions: [
      "Measure actions such as dropping objects, talking, walking, and stamping",
      "Record peak dB levels and GPS-tagged locations",
      "Map loud and quiet zones",
    ],
    features: ["predictionRequired", "gps", "sensors"],
    maxPrototypes: 3,
    estimatedMinutes: 15,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "action",
        label: "Action",
        recorder: "manualChoice",
        choices: [
          "Dropping pen",
          "Dropping book",
          "Talking",
          "Walking",
          "Stomping",
        ],
      },
      {
        key: "soundLevel",
        label: "Sound level",
        unit: "dB",
        recorder: "soundMeter",
        placeholder: "0",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: [
      "ACSSU073 - Sound and energy",
      "ACSIS125 - Processing and analysing data",
    ],
    predictionPrompt: "Which classroom action do you think makes the most noise? Will the quietest action surprise you?",
    extensionTip: "Compare readings from different rooms or outside. How does distance from the source change the dB level?",
    thingsToKnow: [
      {
        heading: "What is a decibel?",
        color: "#2563EB",
        bullets: [
          "Sound is measured in decibels (dB).",
          "A whisper is ~30 dB; normal conversation is ~60 dB.",
          "Every 10 dB increase sounds twice as loud to our ears.",
        ],
      },
      {
        heading: "How sound travels",
        color: "#2563EB",
        bullets: [
          "Sound travels as vibrations (pressure waves) through air.",
          "Hard surfaces reflect sound; soft surfaces absorb it.",
          "Closer to the source = higher dB reading.",
        ],
      },
      {
        heading: "Sound safety",
        color: "#EF4444",
        bullets: [
          "Sounds above 85 dB can damage hearing over time.",
          "Ear protection is vital in loud environments.",
          "Noise pollution affects concentration and wellbeing.",
        ],
      },
    ],
    observationQuestions: [
      "Which action did you predict would create the loudest sound?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
      "Should we wear ear muffs in our classroom? Why or why not?",
    ],
  },
  // Activity 3: Hand Fan
  {
    id: 3,
    title: "Hand Fan Challenge",
    category: "Engineering Challenges",
    icon: "aperture-outline",
    color: "#F59E0B",
    shortDescription: "Test how air movement affects flexible materials.",
    overview:
      "Test how air movement affects materials by building different fan designs.",
    equipment: [
      "Mobile phone with STEMM Lab app",
      "Paper",
      "Cardboard",
      "Scissors",
      "Sticky tape",
    ],
    instructions: [
      "Stand paper upright on a table.",
      "Fan air from 30 cm away.",
      "Observe and record movement.",
      "Repeat with different fan designs and fan distance (15cm, 30cm, 45cm).",
      "Repeat with a cardboard instead of a paper vertical.",
    ],
    features: ["predictionRequired", "gps", "multiplePrototypes"],
    maxPrototypes: 3,
    estimatedMinutes: 15,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "designName",
        label: "Fan design",
        recorder: "manualText",
        placeholder: "e.g. Folded fan",
      },
      {
        key: "material",
        label: "Material",
        recorder: "manualChoice",
        choices: [
          "Thin printer paper",
          "Standard card stock",
          "Thin cardboard",
          "Corrugated cardboard",
        ],
      },
      {
        key: "distance",
        label: "Fan distance",
        unit: "cm",
        recorder: "manualChoice",
        choices: ["15", "30", "45"],
      },
      {
        key: "photoUri",
        label: "Fan Photo",
        recorder: "photo",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: ["ACSSU076 - Forces and motion"],
    predictionPrompt: "Which fan design and material do you think will create the most air movement? Which distance will have the biggest effect?",
    extensionTip: "Try wetting your fan strip — does moisture change how it bends? What does this tell you about the material properties?",
    thingsToKnow: [
      {
        heading: "Air pressure",
        color: "#2563EB",
        bullets: [
          "Fanning creates moving air (wind).",
          "Moving air has lower pressure than still air.",
          "Objects bend toward areas of lower pressure.",
        ],
      },
      {
        heading: "Bernoulli's principle",
        color: "#8B5CF6",
        bullets: [
          "Faster-moving air = lower pressure.",
          "Flexible materials are 'pushed' toward the lower-pressure moving air.",
          "This is why aeroplane wings create lift!",
        ],
      },
      {
        heading: "Material properties",
        color: "#2563EB",
        bullets: [
          "Lighter, thinner materials bend more easily.",
          "Corrugated cardboard is stiffer due to its structure.",
          "The shape of your fan changes how much airflow it creates.",
        ],
      },
    ],
    observationQuestions: [
      "Which fan design did you predict would make the paper move the most?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
      "How does material stiffness affect the bend angle of the paper?",
      "How does fan design influence air velocity and paper movement?",
      "How does distance from the fan affect the bending of the paper?",
    ],
  },
  // Activity 4: Earthquake
  {
    id: 4,
    title: "Earthquake-Resistant Structure",
    category: "Engineering Challenges",
    icon: "construct-outline",
    color: "#0F766E",
    shortDescription: "Build a structure that resists vibration.",
    overview:
      "Design structures that withstand vibration, simulating earthquakes.",
    equipment: [
      "Mobile phone with STEMM Lab app",
      "Cardboard",
      "Paper",
      "Scissors",
      "Sticky tape",
      "Plastic or paper cups",
    ],
    instructions: [
      "Build an anti-vibration layer, by folding paper/cardboard.",
      "Place a flat cardboard platform on top.",
      "Place the phone in the centre and activate vibration mode on the STEMM App.",
      "Modify the structure to reduce movement (e.g. more pillars, more folds, etc).",
    ],
    features: ["predictionRequired", "gps", "multiplePrototypes", "sensors"],
    maxPrototypes: 3,
    estimatedMinutes: 25,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "designName",
        label: "Design name",
        recorder: "manualText",
        placeholder: "e.g. 4 folds + 4 pillars",
      },
      {
        key: "photoUri",
        label: "Structure Photo",
        recorder: "photo",
      },
      {
        key: "vibrationData",
        label: "Vibration",
        unit: "g",
        recorder: "accelerometer",
        vibrate: true,
      },
      {
        key: "movement",
        label: "Movement distance",
        unit: "cm",
        recorder: "manualNumber",
        placeholder: "0",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: [
      "ACSSU096 - Earth processes",
      "ACTDEP025 - Evaluating design solutions",
    ],
    predictionPrompt: "Which structure design do you think will withstand the most vibration? What building features help resist earthquakes?",
    extensionTip: "Try adding a 'base isolator' layer of foam or rubber under your structure. How does it change the vibration readings?",
    thingsToKnow: [
      {
        heading: "What causes earthquakes?",
        color: "#F97316",
        bullets: [
          "Earthquakes occur when tectonic plates suddenly shift.",
          "Energy travels as shockwaves through the ground.",
          "Buildings must absorb or redirect this energy to survive.",
        ],
      },
      {
        heading: "Vibration damping",
        color: "#2563EB",
        bullets: [
          "Anti-vibration layers absorb and spread energy.",
          "Soft materials (foam, rubber) dampen vibrations better than hard materials.",
          "The accelerometer measures g-force — the higher the value, the more shaking.",
        ],
      },
      {
        heading: "Engineering solutions",
        color: "#2563EB",
        bullets: [
          "Real buildings use base isolators and tuned mass dampers.",
          "Flexible structures absorb energy better than rigid ones.",
          "Wider bases and lower centres of gravity improve stability.",
        ],
      },
    ],
    observationQuestions: [
      "Which fold design did you predict would make the phone move the least?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
    ],
  },
  // Activity 5: Stretch & Grace
  {
    id: 5,
    title: "Human Performance Lab",
    category: "Health and Medical Sciences",
    icon: "body-outline",
    color: "#7C3AED",
    shortDescription: "Measure speed, smoothness, and control during movement.",
    overview:
      "Measure speed, smoothness, and coordination using phone sensors.",
    equipment: ["Mobile phone", "Open space"],
    instructions: [
      "Hold phone firmly",
      "Perform guided movements",
      "Repeat the activity with vibration feedback enabled",
      "Record time to complete",
      "Review speed, smoothness, and range-of-motion data",
    ],
    features: ["predictionRequired", "gps", "sensors"],
    maxPrototypes: 3,
    estimatedMinutes: 12,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "movementType",
        label: "Movement",
        recorder: "manualChoice",
        choices: ["Hand circles", "Hand up and down", "Hand side to side"],
      },
      {
        key: "timeSeconds",
        label: "Time to complete",
        unit: "s",
        recorder: "stopwatch",
        placeholder: "0.00",
      },
      {
        key: "vibrationData",
        label: "Phone vibration",
        unit: "g",
        recorder: "accelerometer",
      },
      {
        key: "smoothness",
        label: "Smoothness",
        unit: "%",
        recorder: "gyroscope",
        optional: true,
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: [
      "ACPPS051 - Movement skills",
      "ACPPS054 - Physical performance",
      "ACSSU176 - Structure and function of body systems",
    ],
    predictionPrompt:
      "Which movement will produce the most movement units in the least time? How smooth do you think it will feel?",
    extensionTip: "Try the same movement with your non-dominant hand. Is there a difference in smoothness?",
    thingsToKnow: [
      {
        heading: "What is biomechanics?",
        color: "#2563EB",
        bullets: [
          "Biomechanics is the study of how living things move using physics.",
          "Muscles, bones, and joints all work together to create movement.",
          "Scientists measure speed, force, and smoothness to analyse movement quality.",
        ],
      },
      {
        heading: "Muscle control",
        color: "#2563EB",
        bullets: [
          "Smooth movement requires many muscles coordinating together.",
          "Your brain sends signals through nerves 100s of times per second.",
          "The gyroscope measures angular velocity — jerky motion = high variation.",
        ],
      },
      {
        heading: "Practice improves performance",
        color: "#F97316",
        bullets: [
          "Repeating movements trains your nervous system.",
          "Muscle memory is built through practice and repetition.",
          "Elite athletes have highly trained neural pathways for precise movement.",
        ],
      },
    ],
    observationQuestions: [
      "Which movement was the hardest to keep the vibration low?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
    ],
  },
  // Activity 6: Reaction Board
  {
    id: 6,
    title: "Reaction Board",
    category: "Health and Medical Sciences",
    icon: "pulse-outline",
    color: "#A855F7",
    shortDescription: "Test reaction time and coordination.",
    overview:
      "Measure reaction time and coordination through digital challenges.",
    equipment: ["Mobile phone with STEMM Lab app", "Clear working space"],
    instructions: [
      "Tap when button appears (5 trials)",
      "Record fastest time",
      "Repeat with non-dominant hand",
      "Trace a moving shape on the screen",
      "Rotate through each team member",
    ],
    features: ["predictionRequired", "gps"],
    maxPrototypes: 1,
    estimatedMinutes: 15,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      { key: "teamResults", label: "Team Results", recorder: "teamReaction" },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: ["ACSIS130 - Collecting data"],
    predictionPrompt: "Who do you think has the fastest reaction time in your team? Will the dominant hand always be faster?",
    extensionTip: "Try the test again after 5 minutes of exercise. Does your reaction time change when your heart rate is elevated?",
    thingsToKnow: [
      {
        heading: "How fast is reaction time?",
        color: "#2563EB",
        bullets: [
          "Average human reaction time is 200–300 milliseconds.",
          "Elite athletes can react in as little as 100 ms.",
          "Visual reaction is typically slower than auditory reaction.",
        ],
      },
      {
        heading: "Neural pathways",
        color: "#8B5CF6",
        bullets: [
          "Your brain sends signals through nerves to your muscles.",
          "The longer the neural pathway, the slower the reaction.",
          "Practised skills use faster, more efficient neural routes.",
        ],
      },
      {
        heading: "Dominant hand advantage",
        color: "#2563EB",
        bullets: [
          "Your dominant hand is usually faster due to better-trained pathways.",
          "This gap narrows with deliberate practice of the non-dominant hand.",
          "Age, fatigue, and focus all affect reaction time.",
        ],
      },
    ],
    observationQuestions: [
      "What did you predict your reaction time would be?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
    ],
  },
  // Activity 7: Breathing Trainer
  {
    id: 7,
    title: "Breathing Trainer",
    category: "Health and Medical Sciences",
    icon: "heart-outline",
    color: "#0F766E",
    shortDescription: "Analyse breathing patterns before and after exercise.",
    overview:
      "Analyse breathing patterns using phone sensors to measure chest movement.",
    equipment: ["Mobile phone with STEMM Lab app", "Flat surface or mat"],
    instructions: [
      "Place phone on chest",
      "Record breathing for 30 seconds",
      "Perform exercise (jog/star jumps)",
      "Record again",
      "Compare rates",
    ],
    features: ["predictionRequired", "sensors"],
    maxPrototypes: 3,
    estimatedMinutes: 15,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "condition",
        label: "Condition",
        recorder: "manualChoice",
        choices: [
          "At rest",
          "After Exercise 1 – Jog (1 min)",
          "After Exercise 2 – Star jumps (100)",
        ],
      },
      {
        key: "breathingData",
        label: "Team Breathing",
        recorder: "teamBreathing",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: [
      "ACSSU176 - Body systems",
      "ACPPS051 - Movement skills",
      "ACPPS054 - Physical performance",
    ],
    predictionPrompt: "How many breaths per minute do you take at rest? How much do you think exercise will change it?",
    extensionTip: "Try different types of exercise (slow jog vs. star jumps). Does the intensity of exercise change your recovery time?",
    thingsToKnow: [
      {
        heading: "Why do we breathe?",
        color: "#2563EB",
        bullets: [
          "Breathing delivers oxygen to your blood and removes CO₂.",
          "Every cell in your body needs oxygen to produce energy.",
          "Exercise increases oxygen demand, so your breathing rate rises.",
        ],
      },
      {
        heading: "Breathing rate",
        color: "#2563EB",
        bullets: [
          "Normal resting breathing rate: 12–20 breaths per minute.",
          "Exercise can double or triple your breathing rate.",
          "The accelerometer detects chest rise and fall as you breathe.",
        ],
      },
      {
        heading: "The respiratory system",
        color: "#F97316",
        bullets: [
          "Lungs, diaphragm, and ribcage work together to breathe.",
          "The diaphragm is the main breathing muscle — it flattens to inhale.",
          "Deep breaths are more efficient than many shallow ones.",
        ],
      },
    ],
    observationQuestions: [
      "How many breaths per minute did you predict you would take at rest?",
      "Were your predictions correct?",
      "Did anything surprise you about the results?",
    ],
  },
];

export const getChallengeById = (id: number): Challenge | undefined =>
  CHALLENGES.find((c) => c.id === id);
