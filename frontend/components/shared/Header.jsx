import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";

const Header = () => {
    return (
        <header className="bg-gray-200 text-black p-5 flex justify-between items-center">
            <div>
                <Image 
                    src="/logo.jpg" 
                    alt="Logo de l'application" 
                    width={169} 
                    height={85} 
                    className="w-auto"
                />
            </div>
            <div>
                <ConnectButton />
            </div>
        </header>
    )
}

export default Header;