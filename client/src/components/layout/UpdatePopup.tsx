import { Download, X } from "lucide-react"
import { Card, CardDescription, CardTitle } from "../ui/card"

const UpdatePopup = ({hidePopup}: {hidePopup: ()=> void}) => {
  return (
    <div onClick={hidePopup} className="fixed z-9999 bg-background/80 flex justify-center items-center w-screen h-screen top-0 left-0">
      <Card onClick={(e) => {
        e.stopPropagation()
      }} className="w-95/100 flex relative flex-col max-w-90 items-center gap-2 px-2 py-6">
        <button onClick={hidePopup} className="absolute top-2 cursor-pointer right-2"><X /></button>
        <CardTitle className="text-lg text-center">App Update Available</CardTitle>
        <CardDescription className="p-0 text-base text-center">Click to download new app update</CardDescription>
        <button className="w-full max-w-60 cursor-pointer flex justify-center items-center gap-2 px-3 py-2 rounded-md font-semibold text-lg bg-primary hover:bg-primary/90 transition-all">Download <Download /></button>
      </Card>
    </div>
  )
}

export default UpdatePopup
