'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, FileText, ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

function LazyYouTube({ videoId, title }) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Max resolution thumbnail is higher quality
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  if (isPlaying) {
    return (
      <iframe
        className="absolute inset-0 w-full h-full border-0"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&si=jWzTEyW5nQnbmY4Z`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    )
  }

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden bg-slate-950"
      onClick={() => setIsPlaying(true)}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 800px"
        className="object-cover opacity-80 transition-opacity duration-300 hover:opacity-95"
        priority
      />
      {/* Simple SVG Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 hover:bg-slate-900/25 transition-colors duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform duration-300 hover:scale-110">
          <svg className="h-8 w-8 fill-current translate-x-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function TutorialPage() {
  const tutorials = [
    {
      id: 'request-leave',
      title: 'Cara Mengajukan Cuti di KMU SiCerdas',
      description: 'Panduan lengkap mengisi formulir pengajuan cuti dan memantau status persetujuan.',
      icon: FileText,
      videoId: 'Jm7tleB_uno',
      watchUrl: 'https://youtu.be/Jm7tleB_uno',
    }
  ]

  return (
    <>
      <Navbar />
      <div className="space-y-8 max-w-3xl mx-auto pt-32 pb-12 px-4">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-fit">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary border border-primary/20 shrink-0">
              <PlayCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Tutorial SiCerdas</h1>
              <p className="text-slate-500 mt-1">Panduan video langkah demi langkah untuk membantu Anda menggunakan sistem cuti.</p>
            </div>
          </div>
        </div>

        {/* Column list of Tutorial Videos */}
        <div className="flex flex-col gap-8">
          {tutorials.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.id} className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-3xl">
                <div className="aspect-video w-full bg-slate-950 relative border-b border-slate-100">
                  <LazyYouTube videoId={item.videoId} title={item.title} />
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-2">
                    <Button asChild variant="outline" className="rounded-2xl gap-2 font-semibold">
                      <a href={item.watchUrl} target="_blank" rel="noopener noreferrer">
                        Tonton di YouTube
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}
