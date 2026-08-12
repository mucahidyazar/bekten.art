import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import {publicManagedCopy} from './public-managed-copy'
import styles from './public-managed-pages.module.css'
import {
  bodyParagraphs,
  EditorialLink,
  ManagedFigure,
  ManagedHero,
  pageDetailMedia,
  pageHero,
  SectionHeading,
} from './public-managed-primitives'

import type {PublicLocale} from './public-copy'
import type {PublicPage} from '@/server/public-editorial'

type ManagedPageProps = Readonly<{
  locale: PublicLocale
  page: PublicPage
}>

type ManagedInquiryPageProps = ManagedPageProps &
  Readonly<{inquiry: React.ReactNode}>

function PublishedParagraphs({
  paragraphs,
}: Readonly<{paragraphs: readonly string[]}>) {
  return (
    <div className={styles.publishedProse}>
      {paragraphs.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

export function PublicArtistPage({locale, page}: ManagedPageProps) {
  const copy = publicManagedCopy[locale].artist
  const paragraphs = bodyParagraphs(page.body)
  const biography = paragraphs.slice(1, 2)
  const notes = paragraphs.slice(2)

  return (
    <article className={styles.page}>
      <ManagedHero
        fallbackSrc="/me.jpg"
        locale={locale}
        media={pageHero(page)}
        page={page}
        paragraphs={paragraphs.slice(0, 1)}
      />

      {biography.length > 0 ? (
        <section className={styles.paperSection}>
          <div className={`${styles.shell} ${styles.artistStatement}`}>
            <SectionHeading>{copy.biography}</SectionHeading>
            <PublishedParagraphs paragraphs={biography} />
            <ManagedFigure
              fallbackSrc="/img/bekten-usubaliev-pencil-drawing.png"
              media={pageDetailMedia(page)}
            />
          </div>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section className={`${styles.shell} ${styles.notesSection}`}>
          <SectionHeading>{copy.notes}</SectionHeading>
          <ol className={styles.notesList}>
            {notes.map((note, index) => (
              <li key={note}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p>{note}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <nav
        aria-labelledby="artist-explore-title"
        className={styles.exploreBand}
      >
        <div className={styles.shell}>
          <SectionHeading>
            <span id="artist-explore-title">{copy.explore}</span>
          </SectionHeading>
          <div className={styles.exploreLinks}>
            <EditorialLink href="/works" label={copy.works} locale={locale} />
            <EditorialLink
              href="/exhibitions"
              label={copy.exhibitions}
              locale={locale}
            />
            <EditorialLink
              href="/journal"
              label={copy.journal}
              locale={locale}
            />
          </div>
        </div>
      </nav>
    </article>
  )
}

export function PublicCollectorsPage({
  inquiry,
  locale,
  page,
}: ManagedInquiryPageProps) {
  const copy = publicManagedCopy[locale].collectors
  const paragraphs = bodyParagraphs(page.body)
  const serviceHrefs = [
    '/available-works',
    '/private-viewings',
    '/commission-a-work',
  ] as const

  return (
    <article className={styles.page}>
      <ManagedHero
        action={{href: '#collector-inquiry', label: copy.inquiry}}
        fallbackSrc="/img/heritage-collection-hero.jpg"
        locale={locale}
        media={pageHero(page)}
        page={page}
        paragraphs={paragraphs}
      />

      <section
        aria-label={copy.ways}
        className={`${styles.paperSection} ${styles.servicesSection}`}
      >
        <div className={styles.shell}>
          <SectionHeading>{copy.ways}</SectionHeading>
          <div className={styles.servicesGrid}>
            {copy.services.map((service, index) => (
              <article key={service.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <EditorialLink
                  href={serviceHrefs[index]}
                  label={service.label}
                  locale={locale}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${styles.shell} ${styles.inquirySection}`}
        id="collector-inquiry"
      >
        <SectionHeading>{copy.inquiry}</SectionHeading>
        <div className={styles.inquiry}>{inquiry}</div>
      </section>
    </article>
  )
}

export function PublicCommissionPage({
  inquiry,
  locale,
  page,
}: ManagedInquiryPageProps) {
  const copy = publicManagedCopy[locale].commission
  const paragraphs = bodyParagraphs(page.body)

  return (
    <article className={styles.page}>
      <ManagedHero
        action={{href: '#commission-inquiry', label: copy.inquiry}}
        fallbackSrc="/img/heritage-collection-hero.jpg"
        locale={locale}
        media={pageHero(page)}
        page={page}
        paragraphs={paragraphs}
      />

      <section className={`${styles.paperSection} ${styles.processSection}`}>
        <div className={styles.shell}>
          <SectionHeading>{copy.process}</SectionHeading>
          <ol aria-label={copy.process} className={styles.commissionSteps}>
            {copy.steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${styles.shell} ${styles.faqSection}`}>
        <SectionHeading>{copy.faq}</SectionHeading>
        <Accordion className={styles.faqList} collapsible type="single">
          {copy.faqs.map(faq => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p>{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section
        className={`${styles.shell} ${styles.inquirySection}`}
        id="commission-inquiry"
      >
        <SectionHeading>{copy.inquiry}</SectionHeading>
        <div className={styles.inquiry}>{inquiry}</div>
      </section>
    </article>
  )
}

export function PublicPrivateViewingsPage({
  inquiry,
  locale,
  page,
}: ManagedInquiryPageProps) {
  const copy = publicManagedCopy[locale].privateViewings
  const paragraphs = bodyParagraphs(page.body)

  return (
    <article className={styles.page}>
      <ManagedHero
        action={{href: '#private-viewing-inquiry', label: copy.inquiry}}
        fallbackSrc="/img/heritage-studio-hero.jpg"
        locale={locale}
        media={pageHero(page)}
        page={page}
        paragraphs={paragraphs}
      />

      <section aria-label={copy.benefits} className={styles.benefitsBand}>
        <div className={styles.shell}>
          <h2 className={styles.visuallyHidden}>{copy.benefits}</h2>
          <div className={styles.benefitsGrid}>
            {copy.benefitItems.map((benefit, index) => (
              <article key={benefit.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{benefit.title}</h3>
                <p>{benefit.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.shell} ${styles.viewingDetail}`}>
        <ManagedFigure
          fallbackSrc="/img/workshop/workshop-3.jpeg"
          media={pageDetailMedia(page)}
        />
        <div>
          <SectionHeading>{copy.expect}</SectionHeading>
          <ol className={styles.expectationList}>
            {copy.expectationItems.map((item, index) => (
              <li key={item.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className={`${styles.shell} ${styles.inquirySection}`}
        id="private-viewing-inquiry"
      >
        <SectionHeading>{copy.inquiry}</SectionHeading>
        <div className={styles.inquiry}>{inquiry}</div>
      </section>
    </article>
  )
}

export function PublicStudioPage({locale, page}: ManagedPageProps) {
  const copy = publicManagedCopy[locale].studio
  const paragraphs = bodyParagraphs(page.body)
  const note = paragraphs.slice(1, 2)
  const materials = paragraphs.slice(2)

  return (
    <article className={styles.page}>
      <ManagedHero
        action={{href: '#creative-process', label: copy.process}}
        fallbackSrc="/img/heritage-studio-hero.jpg"
        locale={locale}
        media={pageHero(page)}
        page={{...page, eyebrow: page.eyebrow ?? copy.inside}}
        paragraphs={paragraphs.slice(0, 1)}
      />

      {note.length > 0 ? (
        <aside className={`${styles.shell} ${styles.studioNote}`}>
          <p className={styles.eyebrow}>{copy.note}</p>
          <PublishedParagraphs paragraphs={note} />
        </aside>
      ) : null}

      <section
        className={`${styles.shell} ${styles.processSection}`}
        id="creative-process"
      >
        <SectionHeading>{copy.process}</SectionHeading>
        <ol className={styles.processGrid}>
          {copy.processItems.map((step, index) => (
            <li key={step.title}>
              <span aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {materials.length > 0 ? (
        <section className={`${styles.shell} ${styles.materialsSection}`}>
          <ManagedFigure
            fallbackSrc="/img/workshop/workshop-2.jpeg"
            media={pageDetailMedia(page)}
          />
          <div>
            <SectionHeading>{copy.materials}</SectionHeading>
            <PublishedParagraphs paragraphs={materials} />
          </div>
        </section>
      ) : null}
    </article>
  )
}
