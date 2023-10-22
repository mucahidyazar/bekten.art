import {useTranslations} from 'next-intl'

import {Icons} from '@/components/ui/icons'
import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Get in Touch - Connect with Bekten Usubalie'
  const description =
    '🎨 Reach out to Bekten Usubaliev, share your thoughts, or inquire about his mesmerizing artwork. Join the journey of exploring the depths of human emotions through art.'

  return prepareMetadata({
    title,
    description,
    page: 'contact',
  })
}

export default function Home() {
  const t = useTranslations()

  return (
    <div id="contact" className="flex flex-col gap-6">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2923.9242885428416!2d74.57942840825007!3d42.87444214827549!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x389ec83d105c4fc5%3A0x99db8d90daa9a8ef!2s74%20K.%20Timiryazev%20St%2C%20Bishkek%2C%20Kyrgyzstan!5e0!3m2!1sen!2str!4v1697283723841!5m2!1sen!2str"
        width="100%"
        height="320"
        style={{border: 0}}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:text-start">
        <div className="text-sm text-gray-500">
          <h3 className="mb-2 text-lg">{t('address')}</h3>
          <div className="flex w-60 flex-col gap-1">
            <div className="flex items-start gap-1">
              <Icons.location className="mt-[2px] w-4" />
              <div>
                <p>3 Druzhba Steet, 720031, Bishkek</p>
                <p>Kyrgyz Republic</p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <h3 className="mb-2 text-lg">{t('social')}</h3>
          <div className="flex w-60 flex-col items-center gap-1 text-center lg:items-start lg:text-start">
            <a className="flex items-center gap-1" href="tel:+996312530703">
              <Icons.phone className="w-4" />
              +996 312 530 703
            </a>
            <a
              className="flex items-center gap-1"
              href="mailto:bekten@lycos.ru"
            >
              <Icons.email className="h-fit w-4" />
              bekten@lycos.ru
            </a>
            <a
              className="flex items-center gap-1"
              href="mailto:bekten@lycos.ru"
            >
              <Icons.instagram className="h-fit w-4" />
              bekten_usubaliev
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
