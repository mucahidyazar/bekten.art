'use client'

import NextTopLoader from 'nextjs-toploader'

export function ProgressbarProvider() {
  return (
    <>
      <NextTopLoader
        color="#3b82f6"
        initialPosition={0.08}
        crawlSpeed={200}
        height={40}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #3b82f6, 0 0 5px #3b82f6"
        zIndex={2147483647}
        showAtBottom={false}
      />
      {/* CSS override for extra visibility */}
      <style jsx global>{`
        #nprogress {
          pointer-events: none;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 2147483647 !important;
        }
        #nprogress .bar {
          background: hsl(var(--primary)) !important;
          position: fixed !important;
          z-index: 2147483647 !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 4px !important;
        }
        #nprogress .peg {
          display: block !important;
          position: absolute !important;
          right: 0px !important;
          width: 100px !important;
          height: 100% !important;
          box-shadow:
            0 0 10px hsl(var(--primary)),
            0 0 5px hsl(var(--primary)) !important;
          opacity: 1 !important;
          transform: rotate(3deg) translate(0px, -4px) !important;
        }
      `}</style>
    </>
  )
}
