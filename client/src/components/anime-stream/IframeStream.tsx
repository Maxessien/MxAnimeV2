import { constructStreamUrl } from "@/lib/utils";
import { useSearchParams } from "wouter";

const IframeStream = () => {
  const [searchParam, _] = useSearchParams();

  const malId = searchParam.get("mal_id");
  const ep = searchParam.get("ep");
  const title = searchParam.get("title");

  if (!malId || !ep || !(Number(ep) > 0)) {
    return <div className="w-full h-full flex items-center justify-center">
      <img src="/icon-tran.png" className="w-15" alt="Icon" />
    </div>
  }

  const iframeUrl = constructStreamUrl(malId, ep);

  return (
    <iframe
      src={iframeUrl}
      className="absolute inset-0 w-full h-full border-0"
      allowFullScreen
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      title={`${title ?? "Anime"} Episode ${ep}`}
    />
  )
}

export default IframeStream
