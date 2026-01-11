import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CandidateByPosition {
    candidateId: number;
    fullName: string;
    email: string;
    currentInterviewStep: number;
    currentInterviewStepName: string;
    averageScore: number | null;
}

interface PositionCandidatesResponse {
    positionId: number;
    positionTitle: string;
    candidates: CandidateByPosition[];
}

/**
 * Obtiene todos los candidatos en proceso para una posición específica
 * @param positionId - ID de la posición
 * @returns Información de la posición y lista de candidatos con sus datos
 */
export const getCandidatesByPosition = async (positionId: number): Promise<PositionCandidatesResponse | null> => {
    try {
        // Primero verificar si la posición existe
        const position = await prisma.position.findUnique({
            where: { id: positionId },
            select: { id: true, title: true }
        });

        if (!position) {
            return null;
        }

        // Obtener todas las aplicaciones para esta posición con sus relaciones
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                interviewStep: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                interviews: {
                    select: {
                        score: true
                    }
                }
            }
        });

        // Mapear los datos a la estructura de respuesta
        const candidates: CandidateByPosition[] = applications.map(app => {
            // Calcular puntuación media de las entrevistas con score
            const scoresWithValues = app.interviews
                .map(interview => interview.score)
                .filter((score): score is number => score !== null);

            const averageScore = scoresWithValues.length > 0
                ? scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
                : null;

            return {
                candidateId: app.candidate.id,
                fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
                email: app.candidate.email,
                currentInterviewStep: app.currentInterviewStep,
                currentInterviewStepName: app.interviewStep.name,
                averageScore: averageScore !== null ? Math.round(averageScore * 10) / 10 : null
            };
        });

        return {
            positionId: position.id,
            positionTitle: position.title,
            candidates
        };
    } catch (error) {
        console.error('Error al obtener candidatos por posición:', error);
        throw new Error('Error al recuperar candidatos de la posición');
    }
};
