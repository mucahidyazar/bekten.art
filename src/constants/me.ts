const FIRST_NAME = 'Bekten'
const LAST_NAME = 'Usubaliev'
const FULL_NAME = FIRST_NAME + ' ' + LAST_NAME
const JOB = 'Frontend Developer'
const COMPANY_NAME = '1800flowers'
const COMPANY_URL = 'https://www.1800flowers.com'

const ME_DESCRIPTION = '👋🏼 Hi, it is Bekten. I am a frontend developer and creator of some open source projects since 2017. I create accessible, user-friendly web applications with the best efficient solutions and best practices of the frontend world for SAAS projects. I`m currently working'

const ME_DESCRIPTION_FULL = ME_DESCRIPTION + ' @' + COMPANY_NAME

export const ME = {
  firstName: FIRST_NAME,
  lastName: LAST_NAME,
  fullName: FULL_NAME,
  job: JOB,
  description: ME_DESCRIPTION,
  descriptionFull: ME_DESCRIPTION_FULL,
  social: {
    github: 'bektenusubaliev',
    linkedin: 'bektenusubaliev',
    twitter: 'bektenusubaliev',
    instagram: 'bektenusubaliev',
    medium: 'bektenusubaliev',
    bmc: 'bektenusubaliev',
    codepen: "bektenusubaliev",
    steam: "bektenusubaliev",
    discord: "bektenusubaliev",
    stackoverflow: "bektenusubaliev",
  },
  company: {
    name: COMPANY_NAME,
    url: COMPANY_URL,
  }
}
