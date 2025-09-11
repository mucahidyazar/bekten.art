/**
 * Common save handler logic for all sections
 * Based on the working logic from WorkshopSection
 */

type SectionSaveResult = {
  success: boolean
  message?: string
}

type SectionSaveError = {
  type: string
  message: string
  issues?: any[]
  cause?: any
}

type SectionSaveActionResult = [
  SectionSaveResult | null,
  SectionSaveError | null,
]

interface SectionSaveData<TItem, TSettings> {
  items: TItem[]
  settings: TSettings
}

export const handleSectionSave = async <TItem, TSettings>(
  data: SectionSaveData<TItem, TSettings>,
  saveAction: (
    data: SectionSaveData<TItem, TSettings>,
  ) => Promise<SectionSaveActionResult>,
  sectionName: string = 'section',
): Promise<void> => {
  try {
    console.log(`Saving ${sectionName} data:`, data)

    const [result, error] = await saveAction(data)

    console.log(`${sectionName} action response:`, {result, error})

    if (error) {
      console.error(`${sectionName} action error details:`, {
        type: error.type,
        message: error.message,
        issues: error.issues,
        cause: error.cause,
      })

      if (error.type === 'validation' && error.issues) {
        console.error('Validation issues:', error.issues)
        const validationErrors = error.issues
          .map((issue: any) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')

        throw new Error(`Validation failed: ${validationErrors}`)
      }

      const errorMessage = error.message || 'Unknown server error'

      throw new Error(errorMessage)
    }

    if (result?.success) {
      console.log(`${sectionName} data saved successfully:`, result.message)
    } else {
      throw new Error('Save operation failed - no success response')
    }
  } catch (error) {
    console.error(`${sectionName} save catch block error:`, error)
    throw error
  }
}
