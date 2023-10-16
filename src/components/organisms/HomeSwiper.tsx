'use client'
import {
  EffectFade,
  Navigation,
  Pagination,
  Scrollbar,
  A11y,
  Autoplay,
} from 'swiper/modules'
import {Swiper, SwiperSlide} from 'swiper/react'

import {ArtImage} from '@/components'

export function HomeSwiper() {
  return (
    <div className="w-full">
      <Swiper
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        navigation
        effect="fade"
        pagination={{clickable: true}}
        scrollbar={{draggable: true}}
        // onSlideChange={() => console.log('slide change')}
        // onSwiper={swiper => console.log(swiper)}
        modules={[
          Autoplay,
          EffectFade,
          Pagination,
          Navigation,
          Scrollbar,
          A11y,
        ]}
      >
        <SwiperSlide>
          <ArtImage
            src="/img/workshop/workshop-0.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="w-full h-80 rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <ArtImage
            src="/img/workshop/workshop-1.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="w-full h-80 rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <ArtImage
            src="/img/workshop/workshop-2.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="w-full h-80 rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <ArtImage
            src="/img/workshop/workshop-3.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="w-full h-80 rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <ArtImage
            src="/img/workshop/workshop-4.jpeg"
            description="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
            className="w-full h-80 rounded-lg"
          />
        </SwiperSlide>
      </Swiper>
    </div>
  )
}
