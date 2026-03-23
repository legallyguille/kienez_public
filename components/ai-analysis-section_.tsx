"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import CandidateAIProfile from "@/components/candidate-ai-profile"

interface AIAnalysisSectionProps {
  candidateId: number
}

export function AIAnalysisSection({ candidateId }: AIAnalysisSectionProps) {
  const [showAIProfile, setShowAIProfile] = React.useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAIProfile(!showAIProfile)}
        className="flex items-center space-x-2"
      >
        <Brain className="w-4 h-4" />
        <span>{showAIProfile ? "Ocultar" : "Ver"} Análisis IA</span>
      </Button>

      {showAIProfile && (
        <div className="mt-6">
          <CandidateAIProfile candidateId={candidateId} />
        </div>
      )}
    </>
  )
}
