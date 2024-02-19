### Fork of legacyfighter/cabs-java to Nest.js (TypeScript / Node)

_____________

## General Informations

- Commits are done to the main branch directly because it's just a 'pet/learning project'.
- Project is a legacy application with domain logic and some business rules about CABS which is a fictional cab/taxi company.
- Goal is to refactor the codebase and make it more maintainable and scalable - step by step.

## Introduced Refactorings

#### General Approach**:
- Build safety net with tests (unit or e2e) - cover at least all of the observable behaviors
- Introduce new concept
- Replace old concept with new concept
- Remove old concept
- Observe achieved effect and make a decision about next steps

#### Some of refactorings:

**Value Objects**:

- Problem: Repeated validation logic in many places
  - Solution: `Driver License` Value Object
- Problem: Variable representation of a domain concept
  - Solution: `Money` Value Object - concept with stable interface,
- Problem: Variable presentation - different units
  - Solution: `Distance` Value Object - concept with stable interface
- Problem: Hidden domain concept - unreadable, duplicated code, missing proper domain concept mapping
  - Solution: `Tariff` Value Object

**Aggregates / Entities**:
- Problem: Data inconsistency - lots of setters to bring the object to expected state, repeated
  - Solution: `Transit` Aggregate - interface with business methods, encapsulation of the state, validation, and business rules
- Problem: Too big object / too big database transactions
  - Solution: `CarType`/`CarTypeActiveCounter` - split the object into smaller parts, encapsulate the state, validation, and business rules
- Problem: Mixed process & domain logic
  - Solution: `Claim`/`ClaimResolver` - extract handling business decisions to separate object, leave process logic in service
- Problem: High variability of business rules - inconsistency, variable representation (awards/miles)
  - Solution: `AwardsAccount` / `Awards` - `Miles` interface with different VO implementations, increased encapsulation of AwardsAccount
- Problem: Data inconsistency, low performance
  - Solution: `Contract` - encapsulate the state, validation, and business rules, split the object into smaller parts

**Other**:
- Problem: Creating too heavy reads with use of entities
  - Solution: `SQLBasedDriverReportCreator` - Use single SQL statement to create report instead of using entities and lazy/eager loaded collections
    - Basic example of "Parallel Models" refactorization when based on Feature Flags report is generated old or new way
    - Usage of `Reconciliation` to compare old and new report (#todo - remove - 686a8fe/cabs-java)

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```
