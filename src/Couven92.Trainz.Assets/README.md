# Trainz Simulator Asset Development

My Trainz Assets (KUID starts with `520252`) are all developed in this repository and their sources are stored here in this subfolder.

Each subfolder here constitutes an independant Trainz Asset that is declared by its corresponding config.txt file.

## Permit Management System

AI Driver schedules in Trainz are very linear and _stupid_. Signalling helps, but still there are situations where the default built-in commands simply do not do what you want to achieve.

As I am a Computer Scientist in Real-Life, I desperately need to program large complex AI schedule sequences that automate an entire rail system with multiple trains interacting with each other.

A Permit Management System provides a management asset (more specifically, a Scenario Behaviour) that issues permits for custom objects.

In Computer Science terms, this handles Mutex and Semaphore behaviour for AI Drivers and is closely related to how Trainz natively performs pathing between signal blocks and junctions. My management system simply extends this to any arbitrary resource.

## Named Labels

When writing up long complex AI Driver schedules that include branching and jumping commands, we need labels in the sequence to name certain sections, similar to how headings denote the start of sections in a longer text document.

A naming rule is added to a Scenario to define what label names should be available and appropiate commands use these label names, to insert and jump to labels in a Driver Schedule.

In more advanced scenarios, jumping to a label can be perfomed only if a defined condition is satisfied.
