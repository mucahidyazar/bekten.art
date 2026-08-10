export class EditorialContentNotFoundError extends Error {
  constructor() {
    super('Editorial content not found')
    this.name = 'EditorialContentNotFoundError'
  }
}

export class EditorialPreviewAccessError extends Error {
  constructor() {
    super('Preview access denied')
    this.name = 'EditorialPreviewAccessError'
  }
}

export class EditorialRevisionNotFoundError extends Error {
  constructor() {
    super('Editorial revision not found')
    this.name = 'EditorialRevisionNotFoundError'
  }
}

export class EditorialVersionConflictError extends Error {
  readonly actualVersion: number
  readonly expectedVersion: number

  constructor(expectedVersion: number, actualVersion: number) {
    super('Editorial content was changed by another editor')
    this.name = 'EditorialVersionConflictError'
    this.actualVersion = actualVersion
    this.expectedVersion = expectedVersion
  }
}
