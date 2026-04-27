// data/challenges.ts
import { Challenge } from "../types";

export const CHALLENGES: Challenge[] = [
  // Activity 1: Parachute Drop
  {
    id: 1,
    title: "Parachute Drop",
    category: "Engineering + Physics",
    icon: "arrow-down-circle-outline",
    color: "#FF6B6B",
    shortDescription:
      "Design and test a parachute for the slowest, safest landing.",
    overview:
      "Design, build, and test a parachute for a small toy to reduce landing speed and impact force.",
    equipment: [
      "Small toy",
      "Paper/plastic",
      "String",
      "Scissors",
      "Tape",
      "Table",
    ],
    instructions: [
      "Drop without parachute (baseline)",
      "Build parachute",
      "Record fall time",
      "📹 Record a slow-motion video of the landing",
      "Redesign and test up to 3 prototypes",
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
        key: "fallTimeSeconds",
        label: "Fall time",
        unit: "s",
        recorder: "stopwatch",
        placeholder: "0.00",
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
        key: "slowMotionVideo",
        label: "Slow-motion Video",
        recorder: "video",
      },
      {
        key: "videoAnalysis",
        label: "Frame Analysis",
        recorder: "videoAnalyzer",
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
        color: "#3B82F6",
        bullets: [
          "Drag is a force that opposes movement through air.",
          "A bigger canopy catches more air = more drag = slower fall.",
          "Drag force increases with canopy area and air density.",
        ],
      },
      {
        heading: "Materials matter!",
        color: "#22C55E",
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
      "Were you correct about which design would fall slowest?",
      "Which prototype performed best, and why do you think that is?",
      "What would you change to improve your best design?",
      "Did anything surprise you about the results?",
    ],
  },
  // Activity 2: Sound Pollution
  {
    id: 2,
    title: "Sound Pollution Hunter",
    category: "Environmental Science",
    icon: "volume-high-outline",
    color: "#4ECDC4",
    shortDescription:
      "Measure classroom sounds and compare loud and quiet zones.",
    overview:
      "Measure sound levels in different activities and map noise pollution zones.",
    equipment: ["Mobile phone with microphone"],
    instructions: [
      'Tap "Start Measuring"',
      "Hold phone near the sound source",
      "Wait 5-10 seconds for measurement",
      "Record the peak dB level",
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
    curriculumLinks: ["ACSSU073 - Sound and energy"],
    predictionPrompt: "Which classroom action do you think makes the most noise? Will the quietest action surprise you?",
    extensionTip: "Compare readings from different rooms or outside. How does distance from the source change the dB level?",
    thingsToKnow: [
      {
        heading: "What is a decibel?",
        color: "#3B82F6",
        bullets: [
          "Sound is measured in decibels (dB).",
          "A whisper is ~30 dB; normal conversation is ~60 dB.",
          "Every 10 dB increase sounds twice as loud to our ears.",
        ],
      },
      {
        heading: "How sound travels",
        color: "#22C55E",
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
      "Were your predictions about noise levels correct?",
      "Which action made the most noise — was this expected?",
      "How could you reduce sound pollution in this space?",
      "Did any measurement surprise you?",
    ],
  },
  // Activity 3: Hand Fan
  {
    id: 3,
    title: "Hand Fan Challenge",
    category: "Physics",
    icon: "thermometer-outline",
    color: "#45B7D1",
    shortDescription: "Test how air movement affects flexible materials.",
    overview:
      "Test how air movement affects materials by building different fan designs.",
    equipment: ["Paper", "Cardboard", "Scissors", "Tape"],
    instructions: [
      "Stand paper upright",
      "Fan air from 30cm",
      "Measure bend angle",
      "Try different distances (15cm, 30cm, 45cm)",
    ],
    features: ["predictionRequired", "multiplePrototypes"],
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
        key: "bendAngle",
        label: "Bend angle",
        unit: "°",
        recorder: "manualNumber",
        placeholder: "0",
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
        color: "#3B82F6",
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
        color: "#22C55E",
        bullets: [
          "Lighter, thinner materials bend more easily.",
          "Corrugated cardboard is stiffer due to its structure.",
          "The shape of your fan changes how much airflow it creates.",
        ],
      },
    ],
    observationQuestions: [
      "Which fan design created the most air movement?",
      "Did the material or the fan shape matter more?",
      "Were your predictions correct?",
      "What would you try next to maximise the bend angle?",
    ],
  },
  // Activity 4: Earthquake
  {
    id: 4,
    title: "Earthquake Structure",
    category: "Engineering",
    icon: "construct-outline",
    color: "#96CEB4",
    shortDescription: "Build a structure that resists vibration.",
    overview:
      "Design structures that withstand vibration, simulating earthquakes.",
    equipment: ["Cardboard", "Paper", "Scissors", "Tape", "Cups"],
    instructions: [
      "Build anti-vibration layer",
      "Place phone on platform",
      "Activate vibration",
      "Measure movement",
      "Modify structure and retest",
    ],
    features: ["predictionRequired", "multiplePrototypes", "sensors"],
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
        key: "movement",
        label: "Movement distance",
        unit: "cm",
        recorder: "manualNumber",
        placeholder: "0",
      },
      {
        key: "vibrationData",
        label: "Vibration",
        unit: "g",
        recorder: "accelerometer",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: ["ACSSU096 - Earth processes"],
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
        color: "#3B82F6",
        bullets: [
          "Anti-vibration layers absorb and spread energy.",
          "Soft materials (foam, rubber) dampen vibrations better than hard materials.",
          "The accelerometer measures g-force — the higher the value, the more shaking.",
        ],
      },
      {
        heading: "Engineering solutions",
        color: "#22C55E",
        bullets: [
          "Real buildings use base isolators and tuned mass dampers.",
          "Flexible structures absorb energy better than rigid ones.",
          "Wider bases and lower centres of gravity improve stability.",
        ],
      },
    ],
    observationQuestions: [
      "Which design was most resistant to vibration?",
      "Were your predictions about the best structure correct?",
      "What would you change to improve your best design?",
      "Which part of the design made the biggest difference?",
    ],
  },
  // Activity 5: Stretch & Grace
  {
    id: 5,
    title: "Stretch & Grace",
    category: "Biomechanics",
    icon: "body-outline",
    color: "#FFEAA7",
    shortDescription: "Measure speed, smoothness, and control during movement.",
    overview:
      "Measure speed, smoothness, and coordination using phone sensors.",
    equipment: ["Mobile phone", "Open space"],
    instructions: [
      "Hold phone firmly",
      "Perform guided movements",
      "Record time to complete",
      "Review smoothness",
    ],
    features: ["predictionRequired", "sensors"],
    maxPrototypes: 1,
    estimatedMinutes: 12,
    difficultyLevels: ["primary", "highSchool"],
    measurements: [
      {
        key: "movementType",
        label: "Movement",
        recorder: "manualChoice",
        choices: ["Wrist circle", "Wrist figure-8", "Side arm raise"],
      },
      {
        key: "smoothness",
        label: "Smoothness",
        unit: "%",
        recorder: "gyroscope",
      },
      {
        key: "timeSeconds",
        label: "Time to complete",
        unit: "s",
        recorder: "stopwatch",
        placeholder: "0.00",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: ["ACPPS051 - Movement skills"],
    predictionPrompt: "Which movement do you think will have the smoothest score? Do you think practice will improve your results?",
    extensionTip: "Try the same movement with your non-dominant hand. Is there a difference in smoothness?",
    thingsToKnow: [
      {
        heading: "What is biomechanics?",
        color: "#3B82F6",
        bullets: [
          "Biomechanics is the study of how living things move using physics.",
          "Muscles, bones, and joints all work together to create movement.",
          "Scientists measure speed, force, and smoothness to analyse movement quality.",
        ],
      },
      {
        heading: "Muscle control",
        color: "#22C55E",
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
      "Which movement produced the smoothest score?",
      "Did practice between attempts improve your results?",
      "Were your predictions correct?",
      "What does a high smoothness score tell you about movement control?",
    ],
  },
  // Activity 6: Reaction Board
  {
    id: 6,
    title: "Reaction Board",
    category: "Neuroscience",
    icon: "pulse-outline",
    color: "#DDA0DD",
    shortDescription: "Test reaction time and coordination.",
    overview:
      "Measure reaction time and coordination through digital challenges.",
    equipment: ["Mobile phone"],
    instructions: [
      "Tap when button appears (5 trials)",
      "Record fastest time",
      "Repeat with non-dominant hand",
    ],
    features: ["predictionRequired"],
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
        color: "#3B82F6",
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
        color: "#22C55E",
        bullets: [
          "Your dominant hand is usually faster due to better-trained pathways.",
          "This gap narrows with deliberate practice of the non-dominant hand.",
          "Age, fatigue, and focus all affect reaction time.",
        ],
      },
    ],
    observationQuestions: [
      "Who had the fastest reaction time in your team?",
      "Was there a difference between dominant and non-dominant hands?",
      "Were your team predictions correct?",
      "What factors do you think affected the results most?",
    ],
  },
  // Activity 7: Breathing Trainer
  {
    id: 7,
    title: "Breathing Trainer",
    category: "Medical Science",
    icon: "heart-outline",
    color: "#98D8C8",
    shortDescription: "Analyse breathing patterns before and after exercise.",
    overview:
      "Analyse breathing patterns using phone sensors to measure chest movement.",
    equipment: ["Mobile phone", "Flat surface"],
    instructions: [
      "Place phone on chest",
      "Record breathing for 1 minute",
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
        label: "Chest movement",
        unit: "g",
        recorder: "accelerometer",
      },
      {
        key: "breathsPerMinute",
        label: "Breaths per minute",
        unit: "bpm",
        recorder: "manualNumber",
        placeholder: "12",
      },
      { key: "location", label: "GPS Location", recorder: "gps" },
    ],
    curriculumLinks: ["ACSSU176 - Body systems"],
    predictionPrompt: "How many breaths per minute do you take at rest? How much do you think exercise will change it?",
    extensionTip: "Try different types of exercise (slow jog vs. star jumps). Does the intensity of exercise change your recovery time?",
    thingsToKnow: [
      {
        heading: "Why do we breathe?",
        color: "#3B82F6",
        bullets: [
          "Breathing delivers oxygen to your blood and removes CO₂.",
          "Every cell in your body needs oxygen to produce energy.",
          "Exercise increases oxygen demand, so your breathing rate rises.",
        ],
      },
      {
        heading: "Breathing rate",
        color: "#22C55E",
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
      "How much did exercise change your breathing rate?",
      "Were your predictions about breaths per minute correct?",
      "Which exercise caused the biggest change?",
      "How long did it take for your breathing to return to normal?",
    ],
  },
];

export const getChallengeById = (id: number): Challenge | undefined =>
  CHALLENGES.find((c) => c.id === id);
