'use client'

import {useState} from 'react'
import {createPortal} from 'react-dom'
import {usePopper} from 'react-popper'

import {useOnboard} from './OnboardProvider'

export function Onboardings() {
  const {onboardings, removeOnboarding} = useOnboard()

  const onboardingsArray = Array.from(onboardings, ([id, content]) => ({
    id,
    content,
  }))

  return onboardingsArray.map(onboard => {
    return (
      <Onboard
        key={onboard.id}
        {...onboard}
        onRemove={() => removeOnboarding({id: onboard.id})}
      />
    )
  })
}

interface OnboardProps {
  id: string
  content: string | React.ReactNode
  onRemove: () => void
}
function Onboard({id, content, onRemove}: OnboardProps) {
  const element = document.getElementById(id)

  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLElement | null>(null)
  const {styles, attributes} = usePopper(element, popperElement, {
    modifiers: [{name: 'arrow', options: {element: arrowElement}}],
    placement: 'auto',
  })

  return (
    <>
      <div
        ref={ref => setPopperElement(ref)}
        style={{...styles.popper, zIndex: 100}}
        {...attributes.popper}
      >
        <div className="bg-white text-black">{content}</div>
        <div
          id="popper-arrow"
          ref={ref => setArrowElement(ref)}
          style={styles.arrow}
          className="bg-red-500 w-4 h-4 rounded-full animate-pulse"
          onClick={onRemove}
        />
      </div>

      {createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 mix-blend-hard-light"
          onClick={onRemove}
        >
          <div
            style={{
              position: 'absolute',
              top: element?.getBoundingClientRect().top,
              left: element?.getBoundingClientRect().left,
              width: element?.getBoundingClientRect().width,
              height: element?.getBoundingClientRect().height,
              backgroundColor: 'gray',
              zIndex: 100,
              outline: '2px solid red',
              outlineOffset: '4px',
            }}
          />
        </div>,
        document.getElementById(id) as HTMLElement,
      )}
    </>
  )
}
