#!/bin/sh
npm run migrate
npm run migrate:admin
npm run migrate:payroll
npm run migrate:concepts
npm run migrate:employees
npm run migrate:smmlv
npm run migrate:hours
npm run migrate:absence-types
npm run migrate:absence-catalog
npm run migrate:schedule-import
npm run migrate:rate-rules
npm run migrate:shift-ordinary
npm run migrate:requests
npm run migrate:contracts
npm start
