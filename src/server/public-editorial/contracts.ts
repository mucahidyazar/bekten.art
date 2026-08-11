import type {
  ArtworkPublic,
  CollectionPublic,
  ContentMediaPlacementPublic,
  DeepReadonly,
  EditorialLocale,
  ExhibitionPublic,
  JournalEntryPublic,
  PagePublic,
  PressEntryPublic,
} from '@/server/editorial-content'

type Serializable<T> = T extends Date
  ? string
  : T extends readonly (infer TItem)[]
    ? readonly Serializable<TItem>[]
    : T extends object
      ? {readonly [TKey in keyof T]: Serializable<T[TKey]>}
      : T

type PublicEditorialMediaPlacement = DeepReadonly<
  Serializable<ContentMediaPlacementPublic> & {
    height: number | null
    mimeType: string
    url: string
    width: number | null
  }
>

type PublicEntity<T extends {mediaPlacements: readonly unknown[]}> =
  DeepReadonly<
    Omit<Serializable<T>, 'mediaPlacements'> & {
      id: string
      mediaPlacements: readonly PublicEditorialMediaPlacement[]
    }
  >

type PublicArtwork = PublicEntity<ArtworkPublic>
type PublicCollection = PublicEntity<CollectionPublic>
type PublicExhibition = PublicEntity<ExhibitionPublic>
type PublicJournalEntry = PublicEntity<JournalEntryPublic>
type PublicPage = PublicEntity<PagePublic>
type PublicPressEntry = PublicEntity<PressEntryPublic>

type PublicCollectionDetail = Readonly<{
  collection: PublicCollection
  works: readonly PublicArtwork[]
}>

type PublicExhibitionDetail = Readonly<{
  exhibition: PublicExhibition
  works: readonly PublicArtwork[]
}>

type PublicHomepage = Readonly<{
  collections: readonly PublicCollection[]
  exhibitions: readonly PublicExhibition[]
  hero: PublicArtwork | null
  journalEntries: readonly PublicJournalEntry[]
  pressEntries: readonly PublicPressEntry[]
  works: readonly PublicArtwork[]
}>

interface PublicEditorialReader {
  getCollection(
    locale: EditorialLocale,
    slug: string,
  ): Promise<PublicCollectionDetail | null>
  getExhibition(
    locale: EditorialLocale,
    slug: string,
  ): Promise<PublicExhibitionDetail | null>
  getHomepage(locale: EditorialLocale): Promise<PublicHomepage>
  getJournalEntry(
    locale: EditorialLocale,
    slug: string,
  ): Promise<PublicJournalEntry | null>
  getPage(locale: EditorialLocale, slug: string): Promise<PublicPage | null>
  getPressEntry(
    locale: EditorialLocale,
    slug: string,
  ): Promise<PublicPressEntry | null>
  getWork(locale: EditorialLocale, slug: string): Promise<PublicArtwork | null>
  listCollections(locale: EditorialLocale): Promise<readonly PublicCollection[]>
  listExhibitions(locale: EditorialLocale): Promise<readonly PublicExhibition[]>
  listJournalEntries(
    locale: EditorialLocale,
  ): Promise<readonly PublicJournalEntry[]>
  listPressEntries(locale: EditorialLocale): Promise<readonly PublicPressEntry[]>
  listWorks(locale: EditorialLocale): Promise<readonly PublicArtwork[]>
}

export type {
  PublicArtwork,
  PublicCollection,
  PublicCollectionDetail,
  PublicEditorialMediaPlacement,
  PublicEditorialReader,
  PublicExhibition,
  PublicExhibitionDetail,
  PublicHomepage,
  PublicJournalEntry,
  PublicPage,
  PublicPressEntry,
}
