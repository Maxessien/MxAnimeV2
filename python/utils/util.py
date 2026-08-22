from types.types import PikPakFileInfo

def parse_pikpak_info(info: PikPakFileInfo):
    urls = [link for link in info.get("links").values()]
    
    return urls