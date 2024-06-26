### Fork of legacyfighter/cabs-java ported to Nest.js (TypeScript / Node)

---

## General Informations

This is part of **Legacy Fighter** course. 👨‍🚒🥊

This is just a pet project to learn and practice refactoring techniques and patterns.
It's a fork of the original project written in Java. I've decided to finish it in TypeScript/Node.js using Nest.js framework.

- ✔️ Commits are done to the main branch directly because it's just a 'pet/learning project'.
- ✔️ There is no docker-compose/setup files (maybe todo) - I've used already running databases on my local machine.
- ✔️ Not every part of code is perfect (as it is legacy) - Focus was on refactoring techniques/process.

Repository isn't perfect and fully refactored, there is still big room for improvements but main goal was to practice few of refactoring techinques and apply them to the most important parts based on business value they provide in the context of the application.

🔎 To compare the **BEGINNING** with **FINISHED** state, checkout with use of tags 🔎
- `git checkout beginning`
- `git checkout finished`

### Project Structure 🏗️

- Project is a legacy application with domain logic and some business rules about CABS which is a fictional cab/taxi company.
- Goal is to refactor the codebase and make it more maintainable and scalable - step by step.

## Introduced Refactorings ⚙️

### General Approach:

- [x] Build safety net with tests (unit or e2e) - cover at least all of the observable behaviors
- [x] Introduce new concept
- [x] Replace old concept with new concept
- [x] Remove old concept
- [x] Observe achieved effect and make a decision about next steps

### Some of refactorings:

#### Value Objects:

- Problem: Repeated validation logic in many places
  - Solution: `Driver License` Value Object
- Problem: Variable representation of a domain concept
  - Solution: `Money` Value Object - concept with stable interface,
- Problem: Variable presentation - different units
  - Solution: `Distance` Value Object - concept with stable interface
- Problem: Hidden domain concept - unreadable, duplicated code, missing proper domain concept mapping
  - Solution: `Tariff` Value Object

#### Aggregates / Entities:

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

#### CQRS:

- Problem: Data model that doesn't fit reads too well / too slow driver km report generation
  - Solution: Separate read and write models.
    - `DriverPosition` - keeps info about last driver positions (very frequent writes)
    - `TravelledDistance` - keeps read info about travelled distances
- Problem: Creating too heavy reads with use of entities
  - Solution: `SQLBasedDriverReportCreator` - Use single SQL statement to create report instead of using entities and lazy/eager loaded collections
    - Basic example of "Parallel Models" refactorization when based on Feature Flags report is generated old or new way
    - Usage of `Reconciliation` to compare old and new report (deprecated)

##### Other:

- Problem: Mismatched database paradigm (Graph representation of Transits History)
  - Solution: `GraphTransitAnalyzer` - Use graph database to analyze transit history
  - Usage of `Transactional Outbox` pattern to ensure consistency between graph and SQL database (TODO)
  - ⚙️ TO BE DONE ⚙️: FINISH GRAPH DB IMPLEMENTATION - TransitAnalyzer is covered with tests, plug-in graph db implementation / prepare migration

#### Archetypes (parallel models)

Archetypes in software design provide common patterns and models for developers to follow, aiding in creating more maintainable and scalable codebases. They help streamline development by offering proven solutions to recurring problems, fostering consistency and efficiency in the software development process.

`archetypes` / `repair` | `contracts` module - Examples of archetypes.

- Introduction to `Party, PartyRole, PartyRelationship` patterns/archetypes - responsible for organizing informations about people in different organizations
- State (`Contracts` (tag#archetypes-contracts-better)) - complex state transitions, state management

#### Local Code Structure

- Some refactorings like `Extract Method`, `Introduce Parameter Object`, `Move Method`, `Move Field`, `Inline Method`, `Extract Class`, `Extract Interface`, `Replace Type Code with State/Strategy`, `Replace Conditional with Polymorphism`, etc. but still there is a lot of work to do.

#### Bounded Contexts / Modularisation

- Splitting Transit/TransitDetails
- Loosening dependencies
  - Loose coupling between `Claim` and `Transit` leaving only `transitId` and `transitPrice` - other informations are not needed in this context
  - Remove `driversFee` info from `Transit` (`TransitDetails`)
  - Loose coupling between `AwardedMiles` and `Transit` leaving only `transitId`
- Extracted `ClaimModule` - loose Claim/Client, Client/AwardedMiles/AwardsAccount dependencies - leaving id references, simplified `AwardsService`
- Extracted `ContractsModule` / `CarFleetModule` / `InvoiceModule` / `NotificationModule` / `ClientModule`
- Extracted `DriverFleetModule` - loose coupling between `DriverSession` and `Driver`
- Extracted `TransitAnalyzerModule` - loose coupling to `TransitRepository`
- Created `Loyalty` with `AwardsModule`
- Move `Address`/`Geocoding` and `Distance` to `GeolocationModule`
- Extracted `DriverTrackingModule` - reduce coupling between `Driver` & `Transit` (leave only necessary ids)
- Extracted `RideModule` - splitted `Transit` into `RequestForTransit`, `TransitDemand`, `Transit` entities
  - Extracted `DriverAssignmentModule`
  - Turned `Tariff` into value object
- Extracted few application services in `RideModule` (`CompleteTransit`, `DemandService`, `RequestTransit`, `StartTransit` services)

Above refactorings of operations/entities target was to head into more modular approach
- Splitted the previously monolithic approach into more manageable parts, facilitating clearer transitions between different stages of a ride's lifecycle and having a more maintainable codebase.
- Centralized transit-related and other operations within modules, enhancing code organization and maintainability by grouping relevant functionalities.
- Extracted `DriverAssignment` logic into a dedicated module, simplifying the assignment process and improving driver management during transit requests.
- Created new units tests and updated existing ones to align with structural changes, ensuring reliability and stability post-refactoring.
- Streamlined tariff recognition and calculation through `Tariffs` service, decoupling price computation from transit management for better separation of concerns.

These changes aim at a more modular, maintainable, and clear structure for managing transit lifecycle and related operations, setting a solid foundation for future enhancements.

## Summary

Goal of this project was to practice refactoring techniques and patterns. It's not a perfect project and there is still a lot of work to do but it's a playground for learning and practicing some of refactoring techniques.

Left todos:

- [ ] refactor tests (fixtures)
- [x] remove reconciliation when creating driver-report (marked as deprecated)
- [ ] transactional outbox (graph db / transit history)
- [ ] finish the implementation of `Party, PartyRole, PartyRelationship` archetypes. (_archetypes_)

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
