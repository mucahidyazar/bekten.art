const FIRST_NAME = 'Bekten'
const LAST_NAME = 'Usubaliev'
const FULL_NAME = FIRST_NAME + ' ' + LAST_NAME
const JOB = 'Comtemporary Oil-Focused Painter'
const COMPANY_NAME = 'Bekten'
const COMPANY_URL = 'https://bekten.art'

const ME_DESCRIPTION = `${FULL_NAME} - Çağdaş Sanatın Usta Ressamı. Resimlerinde doğanın güzelliklerini ve kültürel mirası yansıtan ${LAST_NAME}, modern sanatın sınırlarını zorlayan eserleriyle tanınır. Galerimizde onun en etkileyici çalışmalarını keşfedin ve sanatın büyüsüne kapılın.`

const ME_DESCRIPTION_FULL = ME_DESCRIPTION + ' @' + COMPANY_NAME

export const ME = {
  firstName: FIRST_NAME,
  lastName: LAST_NAME,
  fullName: FULL_NAME,
  job: JOB,
  description: ME_DESCRIPTION,
  descriptionFull: ME_DESCRIPTION_FULL,
  social: {
    instagram: 'bekten_usubaliev',
    phone: '996500007926',
    whatsapp: '996500007926',
  },
  company: {
    name: COMPANY_NAME,
    url: COMPANY_URL,
  }
}
