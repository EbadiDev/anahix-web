import type React from 'react'
import { useEffect, useState } from 'react'

interface TypewriterTextProps {
  words: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseDuration?: number
  className?: string
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = '',
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!words || words.length === 0) return

    const fullWord = words[currentWordIndex]

    let timer: ReturnType<typeof setTimeout>

    if (isDeleting) {
      timer = setTimeout(() => {
        setCurrentText((prev) => prev.slice(0, -1))
        if (currentText === '') {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
        }
      }, deletingSpeed)
    } else {
      timer = setTimeout(() => {
        setCurrentText(fullWord.slice(0, currentText.length + 1))
        if (currentText === fullWord) {
          timer = setTimeout(() => {
            setIsDeleting(true)
          }, pauseDuration)
        }
      }, typingSpeed)
    }

    return () => clearTimeout(timer)
  }, [
    currentText,
    isDeleting,
    currentWordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ])

  return (
    <span className={`inline-flex items-center font-black ${className}`}>
      <span>{currentText}</span>
      <span className="inline-block w-0.5 h-6 bg-blue-500 mr-1 animate-pulse" />
    </span>
  )
}
