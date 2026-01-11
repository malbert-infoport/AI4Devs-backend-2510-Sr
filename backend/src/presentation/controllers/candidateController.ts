import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage } from '../../application/services/candidateService';
import { ApplicationError } from '../../application/errors/ApplicationErrors';

export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Controlador para actualizar la etapa de un candidato en el proceso de entrevista
 */
export const updateCandidateStageController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const { newInterviewStepId } = req.body;

        // Validar que se proporcione el campo requerido
        if (newInterviewStepId === undefined || newInterviewStepId === null) {
            return res.status(400).json({ error: 'newInterviewStepId is required' });
        }

        // Validar que newInterviewStepId sea un número
        if (typeof newInterviewStepId !== 'number' || isNaN(newInterviewStepId)) {
            return res.status(400).json({ error: 'newInterviewStepId must be a valid number' });
        }

        const result = await updateCandidateStage(id, newInterviewStepId, req.prisma);
        
        res.json({
            message: 'Interview step updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in updateCandidateStageController:', error);
        
        // Manejo de errores tipados
        if (error instanceof ApplicationError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export { addCandidate };