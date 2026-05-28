export const copy = {
  intro: {
    eyebrow: "officially unserious invitation",
    title: "Want a date?",
    body: "If you choose YES I will pretend to be calm.",
    yes: "YES",
    no: "NO",
    noHints: [
      "Nice try",
      "Click faster!",
      "Think twice",
      "Try harder!"
    ]
  },
  date: {
    eyebrow: "step 2 / logistics",
    title: "Can't wait to see me?",
    body: "Don't worry, I will be flexible.",
    dateLabel: "Date",
    timeLabel: "Time Slot",
    next: "Continue"
  },
  activity: {
    eyebrow: "step 3 / plot",
    title: "Don't bore me!",
    body: "Choose something fun together. I promise I will enjoy it.",
    customLabel: "Custom activity",
    customPlaceholder: "Suggest something to surprise me",
    identityLabel: "Give me a clue only we would understand to know who you are",
    identityPlaceholder: "",
    noteLabel: "Optional note",
    notePlaceholder: "Anything else I should know? ",
    back: "Change date or time",
    submit: "Ready for date!"
  },
  result: {
    eyebrow: "received",
    title: "Congratulations! You got a date with me.",
    body: "I will pretend to be surprised when we meet. See you soon!",
    again: "Send another one"
  },
  submit: {
    sending: "Sending...",
    success: "Sent!",
    error: "Oops... maybe screenshot and text me?"
  }
};

export const timeSlots = [
  { id: "lunch", label: "lunch", detail: "I could eat a cow" },
  { id: "afternoon", label: "afternoon", detail: "nice choice" },
  { id: "evening", label: "evening", detail: "Ok, I will inform my Dad as well." },
  { id: "flexible", label: "flexible", detail: "you choose and I will follow" }
];

export const activities = [
  { id: "climbing", label: "climbing", icon: "\u{1F9D7}", detail: "Let's belay each other!" },
  { id: "kayaking", label: "kayaking", icon: "\u{1F6A3}", detail: "What will you sing on the boat?" },
  { id: "drinks", label: "grab a drink", icon: "\u{1F378}", detail: "When is the last time you got drunk?" },
  { id: "tennis", label: "tennis", icon: "\u{1F3BE}", detail: "I will bring the drama; you bring the serve." },
  { id: "coffee-walk", label: "coffee and walk", icon: "\u2615", detail: "Hope you really like coffee, not just dodging dinner." },
  { id: "exhibition", label: "exhibition", icon: "\u{1F5BC}\uFE0F", detail: "How did you know I am good at pretending to be knowledgeable?" },
  { id: "meal", label: "Meal", icon: "\u{1F37D}\uFE0F", detail: "I admit I'm boring and I will try you laugh during meal." },
  { id: "custom", label: "else", icon: "\u2728", detail: "Try to surprise me!" }
];
