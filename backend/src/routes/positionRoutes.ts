import { Router } from 'express';
import { getCandidatesByPositionController } from '../presentation/controllers/positionController';

const router = Router();

// GET /positions/:id/candidates - Obtener todos los candidatos de una posición
router.get('/:id/candidates', getCandidatesByPositionController);

export default router;
