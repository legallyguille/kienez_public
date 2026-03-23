import Link from "next/link"
import { FaInstagram, FaTiktok } from "react-icons/fa"
import { SiGmail } from "react-icons/si"

export function ContactUs() {
  return (
    <div className="flex flex-row space-y-1 mt-4 justify-center lg:justify-start">
        <Link href="https://www.instagram.com/kienezcr" className="mx-3 content-end" target="_blank">
            <FaInstagram className="w-6 h-6 mb-4" />
        </Link>
        <Link href="https://www.tiktok.com/@kienezcr" className="mx-3 content-center" target="_blank">
            <FaTiktok className="w-6 h-6 mb-4" />
        </Link>
        <Link href="mailto:kienezcr@gmail.com" className="mx-3 content-center" target="_blank"> 
            <SiGmail className="w-6 h-6 mb-4" />
        </Link>
    </div>
  )
}