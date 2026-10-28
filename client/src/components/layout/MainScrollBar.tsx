// import { RefObject, TouchEvent, useState } from 'react'

// const MainScrollBar = ({ elRef }: { elRef: RefObject<HTMLDivElement> }) => {
//   const [scrollBarState, setScrollbarState] = useState({ isVisible: false, currentY: 0 })

//   const handleScroll = (e: TouchEvent<HTMLDivElement>) => {
//     const touches = e.targetTouches.item(e.targetTouches.length)

//     const y = touches.clientY
//     const height = e.currentTarget.offsetHeight

//     const scrollPercentage = ((y - scrollBarState.currentY) / height) * 100

//     const elHeight = elRef.current.offsetHeight

//     elRef.current.scroll({ top: elHeight * scrollPercentage })

//     setScrollbarState(st => ({...st, currentY: y}))
//   }

//   return (
//     <div onTouchMove={handleScroll}>
//       <div></div>
//     </div>
//   )
// }

// export default MainScrollBar
