"use client";

import ContentfulImageUploader from "@/components/ContentfulImageUploader";

export default function ImageTestPage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Contentful Image Upload Testing</h1>
      <ContentfulImageUploader />
    </div>
  );
} 