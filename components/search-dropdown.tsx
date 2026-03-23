"use client"

import { useState, useEffect, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface SearchResult {
  id: number
  nombre: string
  apellido?: string
  alias?: string
  partido?: string
  tipo_candidatura?: string
  pais?: string
  profileImageUrl?: string
  type: "user" | "candidate"
}

interface SearchResults {
  users: SearchResult[]
  candidates: SearchResult[]
}

export function SearchDropdown() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ users: [], candidates: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults({ users: [], candidates: [] })
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data)
        setIsOpen(true)
      } catch (error) {
        console.error("Error en búsqueda:", error)
        setResults({ users: [], candidates: [] })
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleResultClick = () => {
    setIsOpen(false)
    setQuery("")
  }

  const hasResults = results.users.length > 0 || results.candidates.length > 0

  return (
    <div className="flex-1 max-w-lg lg:mx-8" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar usuarios, perfiles políticos..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && hasResults && setIsOpen(true)}
        />

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50 min-w-48">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Buscando...</div>
            ) : hasResults ? (
              <div className="py-2">
                {results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Usuarios
                    </div>
                    {results.users.map((user) => (
                      <Link
                        key={`user-${user.id}`}
                        href={`/profile/${user.id}`}
                        onClick={handleResultClick}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.nombre.charAt(0)}
                            {user.apellido?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.nombre} {user.apellido}
                          </div>
                          <div className="text-sm text-gray-500">@{user.alias}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.candidates.length > 0 && (
                  <div>
                    {results.users.length > 0 && <div className="border-t border-gray-100 my-2" />}
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Candidatos
                    </div>
                    {results.candidates.map((candidate) => (
                      <Link
                        key={`candidate-${candidate.id}`}
                        href={`/candidates/${candidate.id}`}
                        onClick={handleResultClick}
                        className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-8 w-8 mr-3 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{candidate.nombre.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{candidate.nombre}</div>
                          <div className="text-sm text-gray-500">
                            {candidate.partido} • {candidate.tipo_candidatura} • {candidate.pais}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">No se encontraron resultados para "{query}"</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
