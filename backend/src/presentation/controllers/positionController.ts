import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';
import { ApplicationError } from '../../application/errors/ApplicationErrors';

/**
 * Controlador para obtener todos los candidatos de una posición
 */
export const getCandidatesByPositionController = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        // Validar que el ID sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await getCandidatesByPosition(id, req.prisma);
        
        // Verificar si la posición existe
        if (!result) {
            return res.status(404).json({ error: 'Position not found' });
        }

        res.json(result);
    } catch (error) {
        console.error('Error in getCandidatesByPositionController:', error);
        
        // Manejo de errores tipados
        if (error instanceof ApplicationError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
