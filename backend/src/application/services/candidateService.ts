import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../errors/ApplicationErrors';

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

interface UpdateStageResponse {
    applicationId: number;
    candidateId: number;
    candidateName: string;
    positionId: number;
    positionTitle: string;
    previousInterviewStep: number;
    previousInterviewStepName: string;
    currentInterviewStep: number;
    currentInterviewStepName: string;
}

/**
 * Actualiza la etapa del proceso de entrevista de un candidato
 * @param applicationId - ID de la aplicación
 * @param newInterviewStepId - ID del nuevo paso de entrevista
 * @param prisma - Instancia de PrismaClient
 * @returns Información completa de la actualización
 */
export const updateCandidateStage = async (
    applicationId: number,
    newInterviewStepId: number,
    prisma: PrismaClient
): Promise<UpdateStageResponse> => {
    // Usar transacción para prevenir race conditions (TOCTOU)
    return await prisma.$transaction(async (tx) => {
        // Obtener la aplicación actual con todas sus relaciones
        const application = await tx.application.findUnique({
            where: { id: applicationId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                position: {
                    select: {
                        id: true,
                        title: true,
                        interviewFlowId: true
                    }
                },
                interviewStep: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Validar que la aplicación existe
        if (!application) {
            throw new NotFoundError('Application not found');
        }

        // Validar que el nuevo paso es diferente al actual
        if (application.currentInterviewStep === newInterviewStepId) {
            throw new ValidationError('New interview step must be different from current step');
        }

        // Verificar que el nuevo paso de entrevista existe y pertenece al flujo correcto
        const newInterviewStep = await tx.interviewStep.findUnique({
            where: { id: newInterviewStepId },
            select: {
                id: true,
                name: true,
                interviewFlowId: true
            }
        });

        if (!newInterviewStep) {
            throw new NotFoundError('Interview step not found');
        }

        // Validar que el nuevo paso pertenece al mismo flujo de entrevistas de la posición
        if (newInterviewStep.interviewFlowId !== application.position.interviewFlowId) {
            throw new ValidationError('The interview step does not belong to the position\'s interview flow');
        }

        // Guardar información del paso anterior
        const previousStep = application.interviewStep;

        // Actualizar la aplicación con el nuevo paso (dentro de la transacción)
        await tx.application.update({
            where: { id: applicationId },
            data: { currentInterviewStep: newInterviewStepId }
        });

        // Retornar información completa
        return {
            applicationId: application.id,
            candidateId: application.candidate.id,
            candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            positionId: application.position.id,
            positionTitle: application.position.title,
            previousInterviewStep: previousStep.id,
            previousInterviewStepName: previousStep.name,
            currentInterviewStep: newInterviewStep.id,
            currentInterviewStepName: newInterviewStep.name
        };
    });
};

