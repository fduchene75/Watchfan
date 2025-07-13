import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import UserTypeBadge from "./UserTypeBadge";

const Header = () => {
    return (
        <header className="bg-gray-200 text-black py-2 px-5 flex justify-between items-center">
            <div>
                <Image 
                    src="/logo.jpg" 
                    alt="Logo de l'application" 
                    width={169} 
                    height={85} 
                    className="w-auto"
                />
            </div>
            <div className="flex-1 flex justify-center">
                <UserTypeBadge />
            </div>            
            <div>
                <ConnectButton />
            </div>
        </header>
    )
}

export default Header;