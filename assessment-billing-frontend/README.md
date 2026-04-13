# Assessment and Billing Front-End

This is an Angular front-end application for managing enrollment, assessment, and billing in an enrollment system.

## Features

- **Enrollment**: Enroll students with name, course, and email.
- **Assessment**: Submit assessments with student ID, subject, and grade.
- **Billing**: Create billing records with student ID, amount, and description.

## Prerequisites

- Node.js (version 18 or higher)
- Angular CLI (version 17 or higher)

## Installation

1. Navigate to the project directory:
   ```
   cd assessment-billing-frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## API Integration

The application expects a backend API running at `http://localhost:3000` with the following endpoints:

- `GET /enrollments` - Retrieve list of enrollments
- `POST /enrollments` - Create a new enrollment
- `GET /assessments` - Retrieve list of assessments
- `POST /assessments` - Create a new assessment
- `GET /billings` - Retrieve list of billings
- `POST /billings` - Create a new billing

## Troubleshooting

- If the API is not running, the lists will be empty and form submissions will fail.
- Ensure the backend API matches the expected endpoints and data formats.
- For CORS issues, configure the backend to allow requests from `http://localhost:4200`.

## Technologies Used

- Angular 18
- TypeScript
- SCSS
- RxJS

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
