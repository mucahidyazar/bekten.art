export default function Page() {
  return (
    <section className="flex flex-col gap-2 text-xs">
      <h1 className="text-lg font-bold">Privacy Policy</h1>
      <ul>
        <h2 className="text-base font-semibold">Introduction</h2>
        <li>Website: bekten.art</li>
        <li>Contact Email: mucahidyazar@gmail.com</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">Information Collected</h2>
        <li>
          Details from the User model: ID, Name, Email, Email Verified, Image,
          Profession, Description, Location, Role, Created At, Updated At, Share
          Data Preferences, and Email Subscription Preferences.
        </li>
        <li>
          Data from additional relations: Accounts, Sessions, Artworks, Artwork
          Likes, Socials, Feedbacks, Press, and News.
        </li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">Purpose of Data Collection</h2>
        <li>
          To facilitate services such as providing feedback to artists and
          showcasing artists` artworks on the website.
        </li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">Data Sharing and Disclosure</h2>
        <li>
          Personal data is not shared with any third parties and is exclusively
          used for the functioning of bekten.art.
        </li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">User Rights</h2>
        <li>
          Users have the right to access, modify, and delete their personal
          information.
        </li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">Data Security</h2>
        <li>
          The website relies on services like Supabase, Prisma, and Vercel for
          security and operational functionality. No additional specific
          security measures are taken by bekten.art itself.
        </li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">Policy Changes</h2>
        <li>
          Any changes to the privacy policy will be communicated via email.
        </li>
      </ul>
    </section>
  )
}
