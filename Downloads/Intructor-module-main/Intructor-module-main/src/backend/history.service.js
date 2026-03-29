import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getHistorySessions = async () => {
    try {
        const sessions = await prisma.session.findMany({
            orderBy: {
                start_time: 'desc'
            }
        });

        const trainees = await prisma.trainee.findMany();

        // Note: TrainingData and SessionExercise need to be in the schema for this to work
        const trainingData = await prisma.trainingData.findMany({
            include: {
                exercises: true,
            },
        });

        return sessions
            .map((s) => {
                const now = new Date();
                // If it's in the future, it's not history
                if (now < s.start_time) return null;

                const trainee = trainees.find((t) => t.id === s.student_id);

                const training = trainingData.find(
                    (t) => t.session_id === s.id
                );

                return {
                    id: s.id,
                    topic: s.session_title,
                    type: s.training_type === "Ground_School" ? "Class" : (s.training_type || "Class").replace("_", " "),
                    trainee: trainee?.name || "Unknown Trainee",

                    resourceUsed: training?.resource_id || (s.aircraft_id ? `Aircraft ${s.aircraft_id}` : (s.simulator_id ? `Simulator ${s.simulator_id}` : "N/A")),

                    date: s.start_time,

                    sessionOutcome: training?.session_outcome || "completed",
                    debriefSummary: training?.debrief_summary || "",
                    additionalRemarks: training?.additional_remarks || "",

                    lessonPlan: {
                        exercises: training?.exercises ? training.exercises.map(ex => ({
                            id: ex.id,
                            name: ex.exercise_name,
                            type: ex.exercise_type,
                            score: ex.score,
                            completed: ex.completed,
                            notes: ex.notes
                        })) : [],
                    },
                };
            })
            .filter(Boolean);
    } catch (err) {
        console.error("History Service Error:", err);
        throw err;
    }
};