import Link from "next/link"
import { FileText, Gavel, Shield } from "lucide-react"

export function LegalLinks() {
    return (
        <aside className="lg:max-w-2xl sm:w-5/6 md:w-3/4 lg:w-full p-2 top-20 h-fit">
            <div className="hidden lg:block space-y-2 pt-2 border-t">
                <p className="text-xs text-gray-500 mb-2">Enlaces legales</p>
                <div className="flex flex-row space-y-1">
                    <Link
                        href="/terms"
                        className="flex items-center mr-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        Términos
                    </Link>
                    <Link
                        href="/conditions"
                        className="flex items-center mr-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <Gavel className="mr-1 h-3 w-3" />
                        Condiciones
                    </Link>
                    <Link
                        href="/privacy"
                        className="flex items-center mr-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <Shield className="mr-1 h-3 w-3" />
                        Privacidad
                    </Link>
                </div>
            </div>
        </aside>

    )
}
