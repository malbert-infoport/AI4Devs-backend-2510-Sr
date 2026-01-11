const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test data...');
  
  await prisma.$transaction(async (tx) => {
    // Create Company
    const company = await tx.company.create({
      data: {
        name: 'LTI Test Company',
      },
    });
    console.log('Company created:', company.id);

    // Create Interview Flow
    const interviewFlow = await tx.interviewFlow.create({
      data: {
        description: 'Standard development interview process',
      },
    });
    console.log('Interview Flow created:', interviewFlow.id);

    // Create Interview Types
    const phoneType = await tx.interviewType.create({
      data: {
        name: 'Phone Screening',
        description: 'Initial phone screening',
      },
    });

    const technicalType = await tx.interviewType.create({
      data: {
        name: 'Technical Interview',
        description: 'Technical assessment',
      },
    });

    const finalType = await tx.interviewType.create({
      data: {
        name: 'Final Interview',
        description: 'Final interview with management',
      },
    });

    // Create Interview Steps
    const step1 = await tx.interviewStep.create({
      data: {
        interviewFlowId: interviewFlow.id,
        interviewTypeId: phoneType.id,
        name: 'Phone Screening',
        orderIndex: 1,
      },
    });
    console.log('Step 1 created:', step1.id);

    const step2 = await tx.interviewStep.create({
      data: {
        interviewFlowId: interviewFlow.id,
        interviewTypeId: technicalType.id,
        name: 'Technical Interview',
        orderIndex: 2,
      },
    });
    console.log('Step 2 created:', step2.id);

    const step3 = await tx.interviewStep.create({
      data: {
        interviewFlowId: interviewFlow.id,
        interviewTypeId: finalType.id,
        name: 'Final Interview',
        orderIndex: 3,
      },
    });
    console.log('Step 3 created:', step3.id);

    // Create Position
    const position = await tx.position.create({
      data: {
        title: 'Senior Backend Developer',
        description: 'Backend development position',
        status: 'Open',
        isVisible: true,
        location: 'Remote',
        jobDescription: 'Node.js backend development',
        companyId: company.id,
        interviewFlowId: interviewFlow.id,
        salaryMin: 60000,
        salaryMax: 90000,
        employmentType: 'Full-time',
        benefits: 'Health insurance, Remote work',
        contactInfo: 'hr@lti.com',
        requirements: '5+ years Node.js experience',
        responsibilities: 'Develop backend services',
        companyDescription: 'Leading tech company',
        applicationDeadline: new Date('2026-12-31'),
      },
    });
    console.log('Position created:', position.id);

    // Create Employee
    const employee = await tx.employee.create({
      data: {
        companyId: company.id,
        name: 'John Interviewer',
        email: 'john@lti.com',
        role: 'Technical Lead',
        isActive: true,
      },
    });
    console.log('Employee created:', employee.id);

    // Create Candidates
    const candidate1 = await tx.candidate.create({
      data: {
        firstName: 'María',
        lastName: 'García López',
        email: 'maria.garcia@example.com',
        phone: '555-1234',
        address: 'Madrid, Spain',
      },
    });
    console.log('Candidate 1 created:', candidate1.id);

    const candidate2 = await tx.candidate.create({
      data: {
        firstName: 'Juan',
        lastName: 'Pérez Martínez',
        email: 'juan.perez@example.com',
        phone: '555-5678',
        address: 'Barcelona, Spain',
      },
    });
    console.log('Candidate 2 created:', candidate2.id);

    // Create Applications
    const application1 = await tx.application.create({
      data: {
        positionId: position.id,
        candidateId: candidate1.id,
        applicationDate: new Date(),
        currentInterviewStep: step2.id,
        notes: 'Strong candidate',
      },
    });
    console.log('Application 1 created:', application1.id);

    const application2 = await tx.application.create({
      data: {
        positionId: position.id,
        candidateId: candidate2.id,
        applicationDate: new Date(),
        currentInterviewStep: step1.id,
        notes: 'Good potential',
      },
    });
    console.log('Application 2 created:', application2.id);

    // Create Interviews for candidate 1
    await tx.interview.create({
      data: {
        applicationId: application1.id,
        interviewStepId: step1.id,
        employeeId: employee.id,
        interviewDate: new Date('2026-01-05'),
        result: 'Passed',
        score: 9,
        notes: 'Excellent communication',
      },
    });

    await tx.interview.create({
      data: {
        applicationId: application1.id,
        interviewStepId: step2.id,
        employeeId: employee.id,
        interviewDate: new Date('2026-01-08'),
        result: 'Passed',
        score: 8,
        notes: 'Good technical skills',
      },
    });

    console.log('Test data created successfully!');
    console.log('Position ID:', position.id);
    console.log('Application IDs:', application1.id, application2.id);
    console.log('Interview Steps:', step1.id, step2.id, step3.id);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
