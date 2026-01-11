# Especificación para Implementación de Endpoints de Gestión de Candidatos por Posición

## Contexto del Proyecto

Este es un proyecto backend basado en **Node.js + TypeScript + Express + Prisma** con una arquitectura en capas:
- **Capa de Dominio** (`domain/models/`): Modelos de datos
- **Capa de Aplicación** (`application/services/`): Lógica de negocio
- **Capa de Presentación** (`presentation/controllers/`): Controladores
- **Rutas** (`routes/`): Definición de endpoints

El proyecto gestiona candidatos en procesos de selección para diferentes posiciones. Cada posición tiene un flujo de entrevistas (`InterviewFlow`) compuesto por pasos (`InterviewStep`). Los candidatos aplican a posiciones (`Application`) y van avanzando por diferentes etapas del proceso, realizando entrevistas (`Interview`) que son evaluadas con puntuaciones (`score`).

## Base de Datos (Schema Prisma)

**Modelos relevantes:**

```prisma
model Candidate {
  id              Int               @id @default(autoincrement())
  firstName       String            @db.VarChar(100)
  lastName        String            @db.VarChar(100)
  email           String            @unique @db.VarChar(255)
  // ... otros campos
  applications    Application[]
}

model Position {
  id                Int              @id @default(autoincrement())
  title             String
  // ... otros campos
  applications      Application[]
}

model Application {
  id                   Int            @id @default(autoincrement())
  positionId           Int
  candidateId          Int
  currentInterviewStep Int
  // ... otros campos
  position             Position       @relation(fields: [positionId], references: [id])
  candidate            Candidate      @relation(fields: [candidateId], references: [id])
  interviewStep        InterviewStep  @relation(fields: [currentInterviewStep], references: [id])
  interviews           Interview[]
}

model Interview {
  id               Int            @id @default(autoincrement())
  applicationId    Int
  interviewStepId  Int
  score            Int?
  // ... otros campos
  application      Application    @relation(fields: [applicationId], references: [id])
  interviewStep    InterviewStep  @relation(fields: [interviewStepId], references: [id])
}

model InterviewStep {
  id              Int            @id @default(autoincrement())
  interviewFlowId Int
  name            String
  orderIndex      Int
  // ... otros campos
  applications    Application[]
  interviews      Interview[]
}
```

## Estructura Actual de Código

**Ejemplo de controlador existente** (`candidateController.ts`):
```typescript
import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';

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
```

**Ejemplo de rutas existentes** (`candidateRoutes.ts`):
```typescript
import { Router } from 'express';
import { getCandidateById } from '../presentation/controllers/candidateController';

const router = Router();
router.get('/:id', getCandidateById);
export default router;
```

**Ejemplo de servicio existente** (`candidateService.ts`):
```typescript
import { Candidate } from '../../domain/models/Candidate';

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id);
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};
```

---

## Requerimientos de Implementación

### **ENDPOINT 1: GET /positions/:id/candidates**

**Objetivo:** Obtener todos los candidatos que están en proceso de selección para una posición específica.

**Especificaciones técnicas:**

1. **Ruta:** `GET /positions/:id/candidates`
   - El parámetro `:id` es el `positionId`
   - Validar que el ID sea un número válido
   - Retornar error 400 si el formato es inválido
   - Retornar error 404 si la posición no existe

2. **Respuesta esperada:**
   ```json
   {
     "positionId": 1,
     "positionTitle": "Senior Backend Developer",
     "candidates": [
       {
         "candidateId": 5,
         "fullName": "María García López",
         "email": "maria.garcia@example.com",
         "currentInterviewStep": 2,
         "currentInterviewStepName": "Technical Interview",
         "averageScore": 8.5
       },
       {
         "candidateId": 8,
         "fullName": "Juan Pérez Martínez",
         "email": "juan.perez@example.com",
         "currentInterviewStep": 1,
         "currentInterviewStepName": "Phone Screening",
         "averageScore": null
       }
     ]
   }
   ```

3. **Lógica de negocio:**
   - Consultar todas las `Application` donde `positionId` coincida
   - Para cada aplicación:
     - Obtener `firstName` y `lastName` del candidato relacionado (concatenar como `fullName`)
     - Obtener `email` del candidato
     - Obtener `currentInterviewStep` (el ID del paso actual)
     - Hacer JOIN con `InterviewStep` para obtener el `name` del paso actual
     - Calcular la puntuación media (`averageScore`):
       - Obtener todas las `Interview` asociadas a esa `Application`
       - Promediar los valores de `score` (solo los que no sean `null`)
       - Si no hay entrevistas con score, retornar `null`
   - Incluir información básica de la posición (`id`, `title`)

4. **Estructura de archivos a crear/modificar:**
   - **Nuevo servicio:** `backend/src/application/services/positionService.ts`
     - Función: `getCandidatesByPosition(positionId: number)`
   - **Nuevo controlador:** `backend/src/presentation/controllers/positionController.ts`
     - Función: `getCandidatesByPositionController`
   - **Nuevas rutas:** `backend/src/routes/positionRoutes.ts`
     - Definir la ruta `GET /:id/candidates`
   - **Modificar:** `backend/src/index.ts`
     - Importar y registrar `positionRoutes` como `app.use('/positions', positionRoutes);`

5. **Manejo de errores:**
   - 400: ID inválido (no numérico)
   - 404: Posición no encontrada
   - 500: Error interno del servidor

---

### **ENDPOINT 2: PUT /candidates/:id/stage**

**Objetivo:** Actualizar la etapa actual del proceso de entrevista de un candidato específico para una posición.

**Especificaciones técnicas:**

1. **Ruta:** `PUT /candidates/:id/stage`
   - El parámetro `:id` es el `applicationId` (NO el `candidateId`)
   - Validar que el ID sea un número válido
   - Retornar error 400 si el formato es inválido o faltan datos requeridos
   - Retornar error 404 si la aplicación no existe

2. **Request body esperado:**
   ```json
   {
     "newInterviewStepId": 3
   }
   ```

3. **Respuesta esperada:**
   ```json
   {
     "message": "Interview step updated successfully",
     "data": {
       "applicationId": 12,
       "candidateId": 5,
       "candidateName": "María García López",
       "positionId": 1,
       "positionTitle": "Senior Backend Developer",
       "previousInterviewStep": 2,
       "previousInterviewStepName": "Technical Interview",
       "currentInterviewStep": 3,
       "currentInterviewStepName": "Final Interview"
     }
   }
   ```

4. **Lógica de negocio:**
   - Validar que el `newInterviewStepId` exista en la tabla `InterviewStep`
   - Validar que el `newInterviewStepId` pertenezca al `InterviewFlow` de la posición a la que aplica el candidato
   - Obtener la aplicación actual para conocer el `previousInterviewStep`
   - Actualizar el campo `currentInterviewStep` en la tabla `Application`
   - Retornar información completa: nombres del candidato, título de posición, nombres de los pasos (anterior y nuevo)

5. **Validaciones adicionales:**
   - El `newInterviewStepId` debe ser diferente al `currentInterviewStep` actual
   - El `newInterviewStepId` debe existir en la base de datos
   - El nuevo paso debe pertenecer al mismo `InterviewFlow` que la posición
   - Si el nuevo paso no pertenece al flujo correcto, retornar error 400 con mensaje: `"The interview step does not belong to the position's interview flow"`

6. **Estructura de archivos a crear/modificar:**
   - **Modificar servicio:** `backend/src/application/services/candidateService.ts`
     - Nueva función: `updateCandidateStage(applicationId: number, newInterviewStepId: number)`
   - **Modificar controlador:** `backend/src/presentation/controllers/candidateController.ts`
     - Nueva función: `updateCandidateStageController`
   - **Modificar rutas:** `backend/src/routes/candidateRoutes.ts`
     - Agregar ruta: `PUT /:id/stage`

7. **Manejo de errores:**
   - 400: ID inválido, datos faltantes, nuevo paso igual al actual, o paso no pertenece al flujo
   - 404: Aplicación no encontrada o paso de entrevista no encontrado
   - 500: Error interno del servidor

---

## Tests con cURL

**Debes proporcionar ejemplos de prueba con `curl` para ambos endpoints que cubran los siguientes casos:**

### Tests para GET /positions/:id/candidates

1. **Caso exitoso:** Obtener candidatos de una posición existente
2. **Caso error 400:** ID inválido (no numérico)
3. **Caso error 404:** Posición que no existe

### Tests para PUT /candidates/:id/stage

1. **Caso exitoso:** Actualizar etapa correctamente
2. **Caso error 400:** ID inválido
3. **Caso error 400:** Falta el campo `newInterviewStepId` en el body
4. **Caso error 400:** Nuevo paso igual al actual
5. **Caso error 400:** Paso no pertenece al flujo de la posición
6. **Caso error 404:** Aplicación no encontrada

---

## Requisitos de Código

1. **TypeScript estricto:** Tipar correctamente todas las funciones, parámetros y respuestas
2. **Manejo de errores consistente:** Usar try-catch en servicios y controladores
3. **Prisma Client:** Utilizar `req.prisma` para las consultas (disponible mediante middleware)
4. **Código limpio:** Seguir los patrones existentes en el proyecto
5. **Comentarios:** Agregar comentarios explicativos en lógica compleja
6. **Validación de entrada:** Siempre validar parámetros y body antes de procesarlos
7. **Queries eficientes:** Usar `include` de Prisma para cargar relaciones necesarias en una sola consulta cuando sea posible

---

## Estructura de Respuestas de Error

Mantener consistencia con el resto del proyecto:

```typescript
// Error 400
res.status(400).json({ error: 'Mensaje descriptivo del error' });

// Error 404
res.status(404).json({ error: 'Recurso no encontrado' });

// Error 500
res.status(500).json({ error: 'Internal Server Error' });
```

---

## Entregables Esperados

1. ✅ Archivos nuevos creados según estructura especificada
2. ✅ Archivos existentes modificados con los nuevos endpoints
3. ✅ Código TypeScript tipado correctamente
4. ✅ Manejo completo de errores
5. ✅ Tests en formato cURL para todos los casos de prueba
6. ✅ Comentarios en código donde sea necesario
7. ✅ Queries optimizadas con Prisma

---

## Notas Adicionales

- El servidor corre en `http://localhost:3010`
- La base de datos está en PostgreSQL corriendo en Docker
- El proyecto usa `dotenv` para variables de entorno
- Prisma Client ya está configurado y disponible globalmente en las requests
- No es necesario crear migraciones de base de datos, el schema ya está definido
