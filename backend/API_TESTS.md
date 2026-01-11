# Tests cURL para Endpoints de Gestión de Candidatos

## Endpoint 1: GET /positions/:id/candidates

### 1. Caso exitoso - Obtener candidatos de una posición existente
```bash
curl -X GET http://localhost:3010/positions/1/candidates
```

**Respuesta esperada (200 OK):**
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
    }
  ]
}
```

### 2. Caso error 400 - ID inválido (no numérico)
```bash
curl -X GET http://localhost:3010/positions/invalid/candidates
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "Invalid ID format"
}
```

### 3. Caso error 404 - Posición que no existe
```bash
curl -X GET http://localhost:3010/positions/99999/candidates
```

**Respuesta esperada (404 Not Found):**
```json
{
  "error": "Position not found"
}
```

---

## Endpoint 2: PUT /candidates/:id/stage

### 1. Caso exitoso - Actualizar etapa correctamente
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{\"newInterviewStepId\": 2}"
```

**Respuesta esperada (200 OK):**
```json
{
  "message": "Interview step updated successfully",
  "data": {
    "applicationId": 1,
    "candidateId": 5,
    "candidateName": "María García López",
    "positionId": 1,
    "positionTitle": "Senior Backend Developer",
    "previousInterviewStep": 1,
    "previousInterviewStepName": "Phone Screening",
    "currentInterviewStep": 2,
    "currentInterviewStepName": "Technical Interview"
  }
}
```

### 2. Caso error 400 - ID inválido
```bash
curl -X PUT http://localhost:3010/candidates/invalid/stage \
  -H "Content-Type: application/json" \
  -d "{\"newInterviewStepId\": 2}"
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "Invalid ID format"
}
```

### 3. Caso error 400 - Falta el campo newInterviewStepId en el body
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{}"
```

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "newInterviewStepId is required"
}
```

### 4. Caso error 400 - Nuevo paso igual al actual
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{\"newInterviewStepId\": 1}"
```

**Nota:** Suponiendo que la aplicación 1 ya está en el paso 1

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "New interview step must be different from current step"
}
```

### 5. Caso error 400 - Paso no pertenece al flujo de la posición
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d "{\"newInterviewStepId\": 999}"
```

**Nota:** Usando un ID de paso que existe pero pertenece a otro flujo de entrevistas

**Respuesta esperada (400 Bad Request):**
```json
{
  "error": "The interview step does not belong to the position's interview flow"
}
```

O si el paso no existe:

**Respuesta esperada (404 Not Found):**
```json
{
  "error": "Interview step not found"
}
```

### 6. Caso error 404 - Aplicación no encontrada
```bash
curl -X PUT http://localhost:3010/candidates/99999/stage \
  -H "Content-Type: application/json" \
  -d "{\"newInterviewStepId\": 2}"
```

**Respuesta esperada (404 Not Found):**
```json
{
  "error": "Application not found"
}
```

---

## Notas para Ejecutar los Tests

1. **Verificar que el servidor esté corriendo:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Asegurarse de que la base de datos tiene datos de prueba:**
   - Debe haber posiciones creadas
   - Debe haber candidatos con aplicaciones
   - Debe haber pasos de entrevista configurados

3. **Adaptar los IDs según tu base de datos:**
   - Los IDs usados en estos ejemplos (1, 2, 999, 99999) son ilustrativos
   - Verifica los IDs reales en tu base de datos antes de ejecutar las pruebas

4. **Herramientas alternativas:**
   - Puedes usar **Postman** o **Thunder Client** (extensión de VS Code) en lugar de cURL
   - Para Windows PowerShell, ajusta la sintaxis de cURL (usar backticks ` en lugar de \)

5. **Formato de respuestas:**
   - Todas las respuestas son en formato JSON
   - Los códigos de estado HTTP indican el resultado de la operación
