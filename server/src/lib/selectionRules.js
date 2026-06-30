export const SAM1_CYCLE_ID = 'SAM1-2026';
export const MAX_SELECTIONS = 5;

export function completionStatus(selectedCount, hasCompleted = false) {
  if (hasCompleted) return 'Completed';
  if (selectedCount === 0) return '0/5 Not started';
  if (selectedCount < MAX_SELECTIONS) return `${selectedCount}/5 In progress`;
  return '5/5 Ready to complete';
}

export function assertCanCreateSelection({ selections, product, productServiceId, rank }) {
  if (!product) throw Object.assign(new Error('Only approved Products & Services for this team can be selected.'), { status: 404 });
  if (selections.some((selection) => selection.product_service_id === productServiceId)) {
    throw Object.assign(new Error('This Product & Service has already been selected.'), { status: 409 });
  }
  if (selections.length >= MAX_SELECTIONS) {
    throw Object.assign(new Error('A team can select a maximum of five Products & Services per SAM 1 cycle.'), { status: 400 });
  }
  if (rank && selections.some((selection) => selection.rank === rank)) {
    throw Object.assign(new Error('Rank must be unique for this team and SAM 1 cycle.'), { status: 409 });
  }
}

export function assertCanUpdateSelection({ selections, selectionId, rank }) {
  if (rank && selections.some((selection) => selection.id !== selectionId && selection.rank === rank)) {
    throw Object.assign(new Error('Rank must be unique for this team and SAM 1 cycle.'), { status: 409 });
  }
}

export function assertCanComplete(selections) {
  if (selections.length !== MAX_SELECTIONS) {
    throw Object.assign(new Error('Select exactly five Products & Services before marking the team selection complete.'), { status: 400 });
  }
  if (selections.some((selection) => !selection.rationale?.trim())) {
    throw Object.assign(new Error('A short rationale is required for every selected Product & Service.'), { status: 400 });
  }
  if (new Set(selections.map((selection) => selection.rank)).size !== selections.length) {
    throw Object.assign(new Error('Ranks must be unique before completion.'), { status: 400 });
  }
}
