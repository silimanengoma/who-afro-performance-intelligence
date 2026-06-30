# AI Performance Intelligence Governance

## Principles

The Performance Intelligence Copilot explains and suggests. It does not decide, approve, submit, or overwrite validated user content.

Every AI-generated output is marked `AI-generated draft` until reviewed and validated by a user.

## Provider Abstraction

The AI layer supports multiple providers through a shared contract. The MVP provider is deterministic `mock`. Future providers:

- Azure OpenAI
- OpenAI
- Local model

Provider selection is configured through `AI_PROVIDER`.

## Prompt Library

Prompts are stored in `ai_prompt_templates` with template key, version, title, active flag, and prompt text. Prompts are version-controlled in migrations and can later be exposed through an admin editor.

## Context and Citations

AI services consume structured platform data. Outputs must include citations with:

- entity type
- entity id where available
- evidence label
- fields used

Facts and inferences are separated in the generated payload.

## Audit Logs

Every generation writes `ai_audit_logs` with:

- service name
- provider
- prompt key/version
- user
- input context
- data sources
- output
- token estimate

Editable outputs are stored in `ai_generated_outputs`.

## Human Oversight

Users can accept, edit, regenerate, or reject generated content. AI content never auto-submits, auto-approves, or replaces validated user records.

## Role Scope

The context builder applies role scope. Non-admin users are constrained to their Budget Centre where entity-level context supports it.
