const sessions = [
  {
    id: 1,
    title: "Flight Training Session",
    type: "FLIGHT",
    date: "2026-03-17",

    lesson: {
      topic: "Takeoff Procedures",
      objectives: "Understand takeoff safety",
      instructorNotes: "Focus on runway alignment",
      expectedOutcome: "Safe takeoff execution",

      exercises: [
        { id: 1, name: "Checklist Review" },
        { id: 2, name: "Simulator Practice" }
      ]
    },

    notes: [
      { id: 1, content: "Student struggled initially" }
    ],

    grading: { score: 4 },

    debrief: {
      summary: "Good improvement shown"
    }
  }
];

module.exports = sessions;
