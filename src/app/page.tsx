'use client';

import Image from 'next/image';

export default function Home() {
  const images = [
    { src: '/images/pic-1.jpg', alt: 'Image 1' },
    { src: '/images/pic-2.jpg', alt: 'Image 2' },
    { src: '/images/pic-3.jpg', alt: 'Image 3' },
  ];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
     

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.src} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <Image
                src={img.src}
                alt={img.alt}
                width={800}
                height={600}
                className="h-72 w-full object-cover hover:scale-[1.02] transition-transform duration-500"
                priority
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}